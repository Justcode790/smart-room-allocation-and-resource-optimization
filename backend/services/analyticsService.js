const Room = require('../models/Room');
const Timetable = require('../models/Timetable');
const Occupancy = require('../models/Occupancy');
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

class AnalyticsService {
  async calculateUtilization(startDate, endDate) {
    try {
      const rooms = await Room.find({ status: 'active' });
      const timetables = await Timetable.find({ isPublished: true })
        .populate('schedule.roomRef')
        .populate('schedule.subjectRef')
        .populate('schedule.facultyRef');

      const occupancies = await Occupancy.find({
        timestamp: { $gte: startDate, $lte: endDate }
      }).populate('roomRef');

      const heatmap = {};
      const roomStats = {};
      const idleRooms = [];
      const overloadedRooms = [];

      // Initialize heatmap and stats for all rooms
      rooms.forEach(room => {
        heatmap[room._id.toString()] = {};
        DAYS.forEach(day => {
          heatmap[room._id.toString()][day] = {};
          for (let period = 1; period <= 8; period++) {
            heatmap[room._id.toString()][day][period] = 0;
          }
        });
        roomStats[room._id.toString()] = {
          totalMinutes: 0,
          occupiedMinutes: 0,
          utilization: 0,
          room: room
        };
      });

      // Calculate from timetables
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const minutesPerPeriod = 50;
      const totalPeriodsPerWeek = 6 * 8; // 6 days, 8 periods
      const totalAvailableMinutes = totalDays * totalPeriodsPerWeek * minutesPerPeriod;

      timetables.forEach(timetable => {
        timetable.schedule.forEach(session => {
          const roomId = session.roomRef._id.toString();
          const day = session.day;
          const period = session.period;

          if (heatmap[roomId] && heatmap[roomId][day]) {
            // Calculate occupancy percentage for this slot
            const weeks = Math.ceil(totalDays / 7);
            const occupiedMinutes = weeks * minutesPerPeriod;
            heatmap[roomId][day][period] = Math.min(100, (occupiedMinutes / totalAvailableMinutes) * 100);
            
            roomStats[roomId].occupiedMinutes += occupiedMinutes;
          }
        });
      });

      // Calculate from occupancy logs
      occupancies.forEach(occupancy => {
        const roomId = occupancy.roomRef._id.toString();
        if (roomStats[roomId]) {
          roomStats[roomId].occupiedMinutes += 10; // Assume 10 minutes per log entry
        }
      });

      // Calculate utilization percentages
      Object.keys(roomStats).forEach(roomId => {
        const stats = roomStats[roomId];
        stats.totalMinutes = totalAvailableMinutes;
        stats.utilization = (stats.occupiedMinutes / stats.totalMinutes) * 100;
        
        if (stats.utilization < 20) {
          idleRooms.push({
            room: stats.room,
            utilization: stats.utilization.toFixed(2)
          });
        }
        
        if (stats.utilization > 90) {
          overloadedRooms.push({
            room: stats.room,
            utilization: stats.utilization.toFixed(2)
          });
        }
      });

      // Generate suggestions
      const suggestions = this.generateSuggestions(roomStats, timetables);

      return {
        heatmap,
        roomStats,
        idleRooms: idleRooms.sort((a, b) => parseFloat(a.utilization) - parseFloat(b.utilization)),
        overloadedRooms: overloadedRooms.sort((a, b) => parseFloat(b.utilization) - parseFloat(a.utilization)),
        suggestions
      };
    } catch (error) {
      throw new Error(`Analytics calculation failed: ${error.message}`);
    }
  }

  generateSuggestions(roomStats, timetables) {
    const suggestions = [];
    
    // Find underutilized and overutilized rooms
    const underutilized = Object.values(roomStats)
      .filter(s => s.utilization < 30)
      .sort((a, b) => a.utilization - b.utilization);
    
    const overutilized = Object.values(roomStats)
      .filter(s => s.utilization > 85)
      .sort((a, b) => b.utilization - a.utilization);

    // Suggest moving sessions from overutilized to underutilized
    if (overutilized.length > 0 && underutilized.length > 0) {
      const fromRoom = overutilized[0].room;
      const toRoom = underutilized[0].room;

      // Find sessions in overutilized room
      const sessionsToMove = [];
      timetables.forEach(timetable => {
        timetable.schedule.forEach(session => {
          if (session.roomRef._id.toString() === fromRoom._id.toString()) {
            sessionsToMove.push({
              section: timetable.sectionRef,
              subject: session.subjectRef,
              day: session.day,
              period: session.period
            });
          }
        });
      });

      if (sessionsToMove.length > 0) {
        suggestions.push({
          fromRoom: fromRoom.code,
          toRoom: toRoom.code,
          reason: `Redistribute load: ${fromRoom.code} is ${overutilized[0].utilization.toFixed(2)}% utilized, ${toRoom.code} is ${underutilized[0].utilization.toFixed(2)}% utilized`,
          sessionsAffected: sessionsToMove.length
        });
      }
    }

    // Suggest consolidating similar rooms
    const similarRooms = this.findSimilarRooms(roomStats);
    if (similarRooms.length > 0) {
      suggestions.push({
        fromRoom: similarRooms[0].code,
        toRoom: similarRooms[1].code,
        reason: 'Similar capacity and type - consider consolidating',
        sessionsAffected: 0
      });
    }

    return suggestions;
  }

  findSimilarRooms(roomStats) {
    const rooms = Object.values(roomStats).map(s => s.room);
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        if (rooms[i].type === rooms[j].type &&
            Math.abs(rooms[i].capacity - rooms[j].capacity) <= 5) {
          return [rooms[i], rooms[j]];
        }
      }
    }
    return [];
  }

  async getRoomHistory(roomId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const occupancies = await Occupancy.find({
        roomRef: roomId,
        timestamp: { $gte: startDate }
      }).sort({ timestamp: 1 });

      return occupancies;
    } catch (error) {
      throw new Error(`Failed to fetch room history: ${error.message}`);
    }
  }
}

module.exports = new AnalyticsService();

