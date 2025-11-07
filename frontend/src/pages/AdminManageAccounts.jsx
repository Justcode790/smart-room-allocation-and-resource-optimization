import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { adminAPI } from '../api/admin';
import { sectionAPI } from '../api/section';
import { subjectAPI } from '../api/subject';

const AdminManageAccounts = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Student form state
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    regNumber: '',
    mobile: '',
    sectionId: '',
    rollNumber: '',
    year: '',
    batch: '',
    department: '',
  });

  // Faculty form state
  const [facultyForm, setFacultyForm] = useState({
    name: '',
    email: '',
    mobile: '',
    department: '',
    employeeId: '',
    designation: '',
  });

  // CSV upload state
  const [studentFile, setStudentFile] = useState(null);
  const [facultyFile, setFacultyFile] = useState(null);

  useEffect(() => {
    fetchSections();
    fetchSubjects();
  }, []);

  const fetchSections = async () => {
    try {
      const res = await sectionAPI.getAll();
      setSections(res.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await subjectAPI.getAll();
      setSubjects(res.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Handle student form submission
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminAPI.createStudent(studentForm);
      showMessage('success', `✅ ${res.data.message}. Email: ${res.data.credentials.email}, Password: ${res.data.credentials.password}`);
      setStudentForm({
        name: '',
        email: '',
        regNumber: '',
        mobile: '',
        sectionId: '',
        rollNumber: '',
        year: '',
        batch: '',
        department: '',
      });
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to create student account');
    } finally {
      setLoading(false);
    }
  };

  // Handle faculty form submission
  const handleFacultySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminAPI.createFaculty(facultyForm);
      showMessage('success', `✅ ${res.data.message}. Email: ${res.data.credentials.email}, Password: ${res.data.credentials.password}`);
      setFacultyForm({
        name: '',
        email: '',
        mobile: '',
        department: '',
        employeeId: '',
        designation: '',
      });
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to create faculty account');
    } finally {
      setLoading(false);
    }
  };

  // Handle student CSV upload
  const handleStudentCSVUpload = async () => {
    if (!studentFile) {
      showMessage('error', 'Please select a CSV file');
      return;
    }

    setLoading(true);
    try {
      const res = await adminAPI.uploadStudentsCSV(studentFile);
      showMessage('success', res.data.message);
      if (res.data.errors && res.data.errors.length > 0) {
        console.warn('Upload errors:', res.data.errors);
      }
      setStudentFile(null);
      // Reset file input
      document.getElementById('student-csv-input').value = '';
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to upload CSV file');
    } finally {
      setLoading(false);
    }
  };

  // Handle faculty CSV upload
  const handleFacultyCSVUpload = async () => {
    if (!facultyFile) {
      showMessage('error', 'Please select a CSV file');
      return;
    }

    setLoading(true);
    try {
      const res = await adminAPI.uploadFacultyCSV(facultyFile);
      showMessage('success', res.data.message);
      if (res.data.errors && res.data.errors.length > 0) {
        console.warn('Upload errors:', res.data.errors);
      }
      setFacultyFile(null);
      // Reset file input
      document.getElementById('faculty-csv-input').value = '';
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to upload CSV file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Manage Accounts</h1>
          <p className="text-blue-100">Create and manage student and faculty accounts</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('student')}
                className={`px-6 py-4 text-lg font-medium ${
                  activeTab === 'student'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🎓 Students
              </button>
              <button
                onClick={() => setActiveTab('faculty')}
                className={`px-6 py-4 text-lg font-medium ${
                  activeTab === 'faculty'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👨‍🏫 Faculty
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Student Tab */}
            {activeTab === 'student' && (
              <div className="space-y-8">
                {/* Manual Student Form */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">📝 Create Student Account</h2>
                  <form onSubmit={handleStudentSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={studentForm.name}
                          onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={studentForm.email}
                          onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Registration Number
                        </label>
                        <input
                          type="text"
                          value={studentForm.regNumber}
                          onChange={(e) => setStudentForm({ ...studentForm, regNumber: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile
                        </label>
                        <input
                          type="text"
                          value={studentForm.mobile}
                          onChange={(e) => setStudentForm({ ...studentForm, mobile: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Section <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={studentForm.sectionId}
                          onChange={(e) => setStudentForm({ ...studentForm, sectionId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Section</option>
                          {sections.map((section) => (
                            <option key={section._id} value={section._id}>
                              {section.name} - {section.department} Year {section.year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Roll Number
                        </label>
                        <input
                          type="text"
                          value={studentForm.rollNumber}
                          onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? 'Creating...' : 'Create Student Account'}
                    </button>
                  </form>
                </div>

                {/* CSV Upload Section */}
                <CSVUploadSection
                  type="students"
                  file={studentFile}
                  setFile={setStudentFile}
                  onUpload={handleStudentCSVUpload}
                  loading={loading}
                  columns="name, regNumber, email, mobile, section, year, batch, department, rollNumber"
                />
              </div>
            )}

            {/* Faculty Tab */}
            {activeTab === 'faculty' && (
              <div className="space-y-8">
                {/* Manual Faculty Form */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">📝 Create Faculty Account</h2>
                  <form onSubmit={handleFacultySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={facultyForm.name}
                          onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={facultyForm.email}
                          onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile
                        </label>
                        <input
                          type="text"
                          value={facultyForm.mobile}
                          onChange={(e) => setFacultyForm({ ...facultyForm, mobile: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={facultyForm.department}
                          onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., CSE, ECE, ME"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee ID
                        </label>
                        <input
                          type="text"
                          value={facultyForm.employeeId}
                          onChange={(e) => setFacultyForm({ ...facultyForm, employeeId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Designation
                        </label>
                        <input
                          type="text"
                          value={facultyForm.designation}
                          onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Professor, Assistant Professor"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? 'Creating...' : 'Create Faculty Account'}
                    </button>
                  </form>
                </div>

                {/* CSV Upload Section */}
                <CSVUploadSection
                  type="faculty"
                  file={facultyFile}
                  setFile={setFacultyFile}
                  onUpload={handleFacultyCSVUpload}
                  loading={loading}
                  columns="name, email, mobile, department"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// CSV Upload Component
function CSVUploadSection({ type, file, setFile, onUpload, loading, columns }) {
  const inputId = type === 'students' ? 'student-csv-input' : 'faculty-csv-input';

  return (
    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">
        📤 Bulk Upload {type === 'students' ? 'Students' : 'Faculty'}
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>
          <input
            id={inputId}
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>
        <button
          onClick={onUpload}
          disabled={!file || loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Uploading...' : 'Upload CSV'}
        </button>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium mb-2">Expected CSV Format:</p>
          <p className="text-xs text-blue-700 font-mono">{columns}</p>
          <p className="text-xs text-blue-600 mt-2">
            💡 Default password for all accounts: <span className="font-bold">
              {type === 'students' ? 'student123' : 'faculty123'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminManageAccounts;

