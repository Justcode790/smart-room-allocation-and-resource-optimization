# 🔄 Conflict Resolution System - Visual Workflow

## Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ROOM STATUS CHANGE EVENT                         │
│                                                                       │
│  Admin changes room status: active → in_maintenance                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MONGOOSE MIDDLEWARE TRIGGER                       │
│                                                                       │
│  Room.pre('findOneAndUpdate')  - Stores original status             │
│  Room.post('findOneAndUpdate') - Triggers conflict detection         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│              CONFLICT DETECTION SERVICE (< 5 seconds)                │
│                                                                       │
│  1. identifyAffectedEntries()                                        │
│     └─ Query: Timetable.find({ 'schedule.roomRef': roomId })       │
│     └─ Result: List of affected timetable entries                   │
│                                                                       │
│  2. markEntriesAsAffected()                                          │
│     └─ Update: Set isAffected=true, originalRoomId, affectedAt     │
│                                                                       │
│  3. createConflictRecord()                                           │
│     └─ Create: Conflict document with all affected entries          │
│                                                                       │
│  4. notifyRoomConflict()                                             │
│     └─ Send: Socket.IO + Email notifications to admins              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│   ADMIN RECEIVES NOTIFICATION │  │   CONFLICT RECORD CREATED    │
│                               │  │                               │
│  • Socket.IO real-time alert  │  │  • Status: active             │
│  • Email with details         │  │  • Affected entries: 5        │
│  • In-app notification        │  │  • Resolution: pending        │
│                               │  │                               │
│  Actions:                     │  │  Database:                    │
│  [Auto Adjust]                │  │  conflicts collection         │
│  [Manual Adjust]              │  │  timetables (isAffected=true) │
│  [View Details]               │  │                               │
└──────────────────────────────┘  └──────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌─────────────────┐   ┌─────────────────┐
│  AUTO ADJUST    │   │ MANUAL ADJUST   │
└─────────────────┘   └─────────────────┘
        │                       │
        ▼                       ▼
```

---

## Auto-Regeneration Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│              AUTO-REGENERATION SERVICE (< 30 seconds)                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FOR EACH AFFECTED ENTRY:                                            │
│                                                                       │
│  1. Get Entry Details                                                │
│     ├─ Subject: Data Structures (Lab)                               │
│     ├─ Section: CS-A (Strength: 45)                                 │
│     ├─ Day: Monday, Period: 1                                        │
│     └─ Required Equipment: [Computers, Projector]                   │
│                                                                       │
│  2. Query Available Rooms                                            │
│     ├─ Filter: status='active'                                       │
│     ├─ Filter: capacity >= 45                                        │
│     └─ Exclude: Original room + occupied rooms                       │
│                                                                       │
│  3. Score Each Candidate Room                                        │
│     ┌──────────────────────────────────────────────────────────┐   │
│     │  Room: LAB102                                             │   │
│     │  ├─ Type Match (Lab): 50 points                          │   │
│     │  ├─ Capacity (50/45): 30 points                          │   │
│     │  ├─ Equipment Match: 20 points                           │   │
│     │  ├─ Utilization (40%): 6 points                          │   │
│     │  ├─ Building (Same): 15 points                           │   │
│     │  └─ Total Score: 121 points ⭐                           │   │
│     └──────────────────────────────────────────────────────────┘   │
│     ┌──────────────────────────────────────────────────────────┐   │
│     │  Room: CR201                                              │   │
│     │  ├─ Type Match (Classroom): 10 points                    │   │
│     │  ├─ Capacity (60/45): 20 points                          │   │
│     │  ├─ Equipment Match: 10 points                           │   │
│     │  ├─ Utilization (60%): 4 points                          │   │
│     │  ├─ Building (Different): 5 points                       │   │
│     │  └─ Total Score: 49 points                               │   │
│     └──────────────────────────────────────────────────────────┘ dy
duction ReaPros**: atu**St 1.0  
on**:4  
**Versi02mber 2*: Deceed***Last Updat
---


```
─────┘─────────           └            t  │
   • equipmen       │                 
 iresLab│equ• r │                      
      │pe      │ • ty                   
              │      │                   
    t    │  │   Subjec                      
 ───────┐──────        ┌─              ▼
                            
            │         ──────┘  ────    │
└────      │       data  
│ • meta──────┘ └────────        ewRoomId  │
│ • nings  │ild   Bu│         │Id  • oldRoomrred  │
│   │ • prefe     geType │  
│ • chanrength   │st• │           │ • adminId  
│      │         │         │     
│         ion    │    │   Sectog    │     AuditL──┐
│  ───────┌─────         ──────┐────   ▼
┌────               ▼       
              │        │                │
                        │──┘
      ──────     └──────  ┘  ──────└──────────┘         ─────────── │
└─ent │ • equipm       Id│ nflict  - co  │       │     mary│ • sum      │
  │ • type d│      ecteisAff-  │               │ tus sta
│ •ity   │ac   │ • cap │      mRef   - roo         │ ed[] │ct • affeus     │
│atst •    ││      []  • schedule│         │oomId        │
│ • r                  │      │  │                       │ │
│       m     oo────▶│     Re   │────metabl│  Ti──────▶ │──t  │   Conflic─────┐
 ┌─────────        ──────────┐    ┌─────┐     ────────────┘

┌───────────────────────────────────────────────────────────────────  │
└───                          OLLECTIONSBASE C  DATA                  │  ─────┐
──────────────────────────────────────────────────────────┌──────```
ships

elationase Schema R Datab-

##```

--─┘
────────────────────────────────────────────────────────────
└────────      │                    (>10%)  ate  railureation fHigh notific│
│  ⚠️                                (<50%)   ion rate utresolo-️ Low aut    │
│  ⚠                        r)        e (>10/hounflict rat  ⚠️ High co  │
│                                                           Alerts:  │
│                                                                      │
│                                        98%ess Rate:on Succatiotific│
│  N                                          ent: 450   ifications S  Not       │
│                       s   e: 15 secondution Timge Resol
│  Avera │                                   Rate: 80%Succession Auto-Resolut   │
│                                      %) 83olved: 10 (nflicts Res
│  Co   │                                     Today: 12 ctedcts Deteonfli  C  │
│                                                                   
│       │                                 RD          ING DASHBOA
│  MONITOR────────┐───────────────────────────────────────────────────┌──────────       ▼
                        ▼          ▼         
              │                │                              │    ─────┘
  ───────────    └─────────┘  ─────────┘      └────────────────
└  │   get: <5s ar  │ T   s     │ get: <30│      │ Tar5s  et: <arg    │
│ Telivery           │ D    │         │ Time  │       │ Time      n     │
Notificatio     │ generation│ to-Re │      │ Aution   
│ Detec─┐────────────┌────────┐      ────── ┌──────────┐     ──────────   ▼
┌───                               ▼               ▼    ─┐
     ─────────────────────────────────┼──────────────       ┌──    │
                          ────┘
     ──────────────────────────────────────────────────────────────  │
└───                           METRICSNCE MAPERFOR                   ──┐
│   ─────────────────────────────────────────────────────────────```
┌──────

onitoringrformance M-

## Pe
```

--───────────┘────────────────────────────────────────────────────────── │
└                              er entries  othssingnue proce 4. Conti       │
│                                  y options veride reco  3. Prov        │
│                                f failure  y admin oif 2. Not     │
│                                   contextor with fullog err│  1. L    │
                                                                  │
│                                     Y        OVERGING & REC│  ERROR LOG┐
────────────────────────────────────────────────────────────
┌─────────   ▼                      
         ────┘─────────────────┼────────────────────────     └─────
     │               │                               
        │  ─────────┘  └─────────┘    ─────────────────┘      └──────────────└─   │
        Later     │t       │   ignmen  │ Ass         │  
│ Manual   │ue for         │ Que     │  vent          │ Preres     │ qui     │
│ Re (3x)     │ Retry  │       rror Show E│      │ s      ┐
│ Mark a───────┌───────────    ──┐  ─────── ┌───────────┐     ───────────
┌─    ▼              ▼                                     ▼   │
                         │                               │  ─────────┘
└──────────┘      ────────  └─────────   ──┘ ───────────└─        │
e  Failur │      │                 │      ms        │    │
│ Rooion  tificatNo     │ on Error │ ati Valid   │able │   
│ No Avail─────────┐─────────  ┌────┐    ────────────   ┌──   ─────────┐   ▼
┌─────                       ▼                  ▼             ───┐
 ────────────┼───────────────────────────────────      ┌ │
                                  ─────┘
 ───────────────────────────────────────────────────────────└─────
   │                      ARIOS     SCEN  ERROR                   │     ───────┐
───────────────────────────────────────────────────────``
┌───────g Flow

`Handlin

## Error 

---``
`──┘───────────────────────────────────────────────────────────────────      │
└                                           s erate report• Gen  │
│                                         y       entry histor
│  • View   │                                                  oom Filter by r
│  •    │                                      ype    change t• Filter by │
│                                                 dmin   r by aFilte  │
│  •                                             ange date rFilter by│  •        │
                        d)           (paginate logsw all Vie  │
│  •                                                            
│            │                                          RIES      G QUE AUDIT LO──┐
│ ──────────────────────────────────────────────────────────────────     ▼
┌─                    │
                                        ────┘
   ───────────────────────────────────────────────────────────────  │
└──                                                              }      
│      │                                                   }           │
│                                           10:00"     Time: "
│      end     │                                       0","09:0 tartTime: s│
│                                                          riod: 1,    pe │
│                                            ,         "Monday"   day:
│    │                                    flict_id",d: "contInflic
│      co  │                                                 {     metadata:   │
│                               [],   en:gsOverriddnWarnin  validatioe", │
│  changus  room statment due tossignom rea rotomatic "Auason:re│        │
                         ",      ter Lab 2ame: "CompunewRoomN│       │
                                      AB102",  e: "LodRoomC│    new
 │                                    _id",     Id: "LAB102wRoom│
│    ne                             b 1",      ter Laompu"C: ldRoomName
│    o │                                     ",     AB101"L mCode:
│    oldRoo        │                                 _id", LAB101mId: "
│    oldRoo │                          ",      eneration: "auto_reggeTypehan
│    c       │                        table_id", me"tiId: ntryetableE │
│    tim                                ",         sere: "Admin U adminNam
│          │                                user_id",  d: "admin_nIadmi    │
│                              ", 5:00Z-12-10T10:0amp: "2024
│    timest      │                                                       │  {       
 │                                                                           │
│                                               G ENTRY   AUDIT LO
│──────┐────────────────────────────────────────────────────────────   ▼
┌───                      
         ──┘───────────┬───└──────────                     │
                                  │         ────┘
   ─────────────────└───────────┘  ───────────────────────────      │
└─STMENT LOGADJUMANUAL   │  │     TION LOG  EGENERAAUTO-R─────┐
│   ────────────────────┐  ┌─────────────────────────────────
┌──        ▼                ▼            
           ───────┐──┴────────────────        ┌─           │
                        
           ────┘───────────────────────────────────────────────────────────────    │
└──                           LOGGING  DIT      AU               
│    ────┐───────────────────────────────────────────────────────────────``
┌──ow

`dit Trail Fl

## Au`

---┘
``─────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────└────────  │
│    │             ce          ntenan is in mai01oom LAB1Reason: R│  │
│  │                                                               
│  │  │  │                        Floor 1    uilding,in Bg: Ma│ • Buildin│     │  │
                                    2 ✅  LAB10w Room:   │ • Ne   │  │
│                               ❌       om: LAB101  • Old Ro
│  │ │  │                                    0:00      me: 09:00-1│
│  │ • Ti  │                                               ay  ndMo  │ • Day: │  │
│                                              ion: CS-A Sect  │ •     │  │
│                                urestructta Sect: Da
│  │ • Subj │ │                                     been moved:lass has│ Your c   │  │
│                                                           │
│  │          │                 tures       Structa  Dage - Chan
│  │ 📍 Room──────┐  │───────────────────────────────────────────────────────  ┌─
│        │                                     tion:     otificaser N   │
│  U                                                                   
│ ────┘  │──────────────────────────────────────────────────────────
│  └  │  │               ails]ew Detjust] [Vial Ad[Manuust] Auto Adj  │
│  │ [           │                                               │  │       │  │
                                     more       ... and 3 │  │ •      │  │
               0-11:00)    e 10:0S-B (Tuhms - Corit│ • Alg      │  │
│         0:00)      on 09:00-1(Mes - CS-A turata Struc D│ •│  │
│                                        ns:      ioted Sess  │ Affec│  │
│                                                        │             │  │
│                                     ffected  essions a│  │ 5 s│
      │                       nance nten_mai is now i101m LAB
│  │ Roo  │    │                                                     │           │  │
│                       LAB101  etected -Conflict D⚠️ Room ┐  │
│  │ ────────────────────────────────────────────────────────────
│  ┌──  │                                         tion:      icatifAdmin No    │
│                                                           
│           │                                       ENT        ION CONTNOTIFICAT───┐
│  ─────────────────────────────────────────────────────────
┌─────────       ▼      ▼              ▼                   ▼   ▼    │
                 │        │           │              │ 
    ──┘────────────┘ └─└──────────┘  └──────────┘──┘ └─────────────c) │
└0se│ (<3tant)│ ist)│ │ (InsPers│ │ () (<10sect)│ │ tanns │
│ (I│ │  Email  t.IO │ │ Socke│ │  In-App   O│ │  Email  Socket.I──────┐
│─┐ ┌─────────────┐ ┌─────────┐ ┌──┐ ┌─────────┌──────────
    ▼         ▼ ▼               ▼        ▼        ▼        ─┐
──────────────┼───────────┐   ┌─────┼─────    ┌────── │
                             │                 ────┘
    ───────────────────└───────┘  ───────────────────────
└───────   │     ge)      an (Room Ch    │  │  n)   ict Detectio  (Confl      │
│ NS   FICATIO  USER NOTI     │  │ ICATIONS   TIFNOIN 
│   ADM─┐─────────────────────────────┐  ┌─────────────────────────────      ▼
┌─                    ▼                     ────┐
─────────┴───────     ┌──────                        │
                   ──┘
      ──────────────────────────────────────────────────────────────│
└─────                       ON  TIBUTION DISTRI    NOTIFICA           
│     ─────┐───────────────────────────────────────────────────────────────```
┌─n Flow

 Notificatio
##``

---
┘
`──────────────────────────────────────────────────────────────────── │
└─                         ilsarning detath wications wi notifSend3.  │
│                                      ' rridein ove: 'Adm• reason  │
│                       ]       : [...riddenningsOverar validationW   •    │
│                           '      rced_updateype: 'fo   • changeT       │
│                                              to audit: │  2. Log      │
                                  try    metable enpdate ti
│  1. U        │                                                            │   │
                                              PLIED  ATE AP FORCE UPD
│ ───┐─────────────────────────────────────────────────────────────────nfirm)
┌─  ▼ (Co                             │
                                  ┘
   ─────────────────────────────────────────────────────────────────  │
└────                     ────┘     ───────────┘  └──────────────
│  └───│                            │     Confirm   │  el        │ 
│  │  Canc          │            ┐      ────────── ┌────────────────┐ 
│  ┌──────   │                                                                 
│    │                                               oversized• Capacity │
│                                                 equipment  ing • Miss
│          │                         sroom) ash (Lab → Clmatcype mis
│  • T          │                           n:     iddeto be overrs Warning      │
│                                                                  
│      │ou sure?"Are ynings. ation warde valid will overrihis action
│  "T     │                                                               │
│                                                 G   ATION DIALONFIRM CO
│ ──────────┐───────────────────────────────────────────────────────────date)
┌Force Up    ▼ (                                │
                              ────┘
  ─────────────────────────────────────────────────────────
└────────│                            ─┘──────────────┘  └─────────────│  └────         │
          │         rride)    Ove   │  │  (k)  aco b  (G│
│  │                       e  │     pdatrce U  │  │  Fo  cel    │  Can   │
│                      ───┐     ──────────────┐  ┌─────────────
│  ┌──      │                                                           
│             │                                       N        MIN DECISIO
│  AD──────────┐─────────────────────────────────────────────────────────  ▼
┌──                           │
                                     ───────┘
  ──────────────────────────────────────────────────────────────   │
└          (45)"     ededne than s larger iity (60)om capac"Ro│             │
                               d        versizeity O Capac
│  ⚠️  │                                                                       │
│               " putersd Lab ComSpecialize equipment:   "Missing
│         │                                      ssing    ipment Mi│  ⚠️ Equ       │
                                                              │
│  a Lab"  s equireubject r the sm, buta Classrooed room is ectel
│     "S           │                                       atch   Type Mism│
│  ⚠️                                                         ings:  
│  Warn       │                                                                │
│                                          true ⚠️   Update: anForce │
│  c                                                      falseid:
│  isVal          │                                                       │
│                                                      ON RESULT   TI  VALIDA──────┐
│───────────────────────────────────────────────────────
┌────────  ▼                                         │
                    
     ─────┘─────────────────────────────────────────────────────────────│
└───                 b subject   for La (Classroom): CR301lects sedmin──┐
│  A──────────────────────────────────────────────────────────────  ▼
┌─────                           │
                                      ──┘
 ────────────────────────────────────────────────────────────
└───────           │      NGS         TH WARNIDATION WIALI     V       
│        ─────┐───────────────────────────────────────────────────────────
```
┌─────pdate
th Force Uw win Workfloalidatio

## V
---
─┘
```────────────────────────────────────────────────────────────────────   │
└                               to users    ons ificatiot│  4. Send n       │
                             tatus        ste conflict
│  3. Upda          │nt')        adjustme: 'manual_ (changeTypeog to audit│
│  2. L                                          ntry imetable e1. Update t    │
│                                                          ons:  │
│  Acti                                                                     
│       │                                                            │  }         │
                                                     ]         │
│                }  " AB102_IDId": "LnewRoom, "": 0ryIndex{ "ent│        │
                                            ": [    signments  "as
│     │                                                                
│  {           │                    al-adjust/:id/manuflictsT /api/conPOS  │
│                                                                 │
│                                                 ssignment ply ATEP 4: Ap─────┐
│  S──────────────────────────────────────────────────────────────── ▼
┌                                  │
                                ───────┘
 ──────────────────────────────────────────────────────────────      │
└                                          lid ✅    lt: Va
│  Resu        │                                                     
│                    │            nt     eme requirLabb matches : La✅ Room Type      │
│                                      e   ablil Slot: Ava  ✅ Time
│      │                         e d availabl requirement: AllEquip│
│  ✅                                                y: 50 >= 45acitCap│  ✅        │
                                  ive      act Status:om  │
│  ✅ Ro                                                  :         │
│  Checks                                                                         │
│                               room alidate-conflicts/vOST /api/    │
│  P                                                          │               │
                           cond)    n (< 1 seioValidat│  STEP 3: ────────┐
─────────────────────────────────────────────────────────────  ▼
┌                               
       │                       ───┘
     ───────────────────────────────────────────────────────────────│
└───                                             AB102 clicks on L│
│  Admin                                                                 │
│                                                 oomlects Rdmin SeP 2: A
│  STE─┐─────────────────────────────────────────────────────────┌───────────        ▼
                            │
                            ────┘
    ─────────────────────────────────────────────────────────└─────────┘  │
────────────────────────────────────────────────────────────
│  └─   │  │                                      es ✓Available: Y    •   │  │
│  │                                    ion: 45%   • Utilizat  
│  │        │  │                              artial ⚠️: P• Equipment   
│  │        │  │                     able)    60 (Acceptity: pac │    • Ca│      │  │
        )           requiredm ⚠️ (Lab srooe: Clas│    • Typ│     │  │
                            air  65) ⭐⭐ F1 (Score:  │ 3. CR30│
│────┐  ───────────────────────────────────────────────────────  │
│  ┌──────────┘─────────────────────────────────────────────── └────────
│    │  │                                   Yes ✓    vailable:
│  │    • A       │  │                                   55%on:tilizati • U    │
│  │  │                          ✓    le ilabll avapment: A Equi │    • │
│     │                         e)    5 (Acceptabl: 5acity│    • Cap
│    │  │                                         ab ✓     • Type: L │
│  │         │                    ⭐⭐⭐⭐ Good re: 115)3 (Sco 2. LAB10 │
│  │─────────┐ ─────────────────────────────────────────────────
│  ┌──────┘  │────────────────────────────────────────────────────────────│  │
│  └                               ✓           Yes le:• Availab│     │  │
│                                     40%     lization:     • Uti
│  │    │  │                        ✓   lable All avaiEquipment: │  │    •   │  │
                            erfect fit) acity: 50 (P    • Cap│
│  │    │                                      ab ✓      : L│    • Type  │
│      │               nt ⭐⭐⭐ Excelleore: 121) ⭐⭐02 (ScB1. LA│
│  │ 1─────────┐  ──────────────────────────────────────────────
│  ┌───────         │                           ns     tioop 5 Suggesponse: Tes    │
│  R                                                                │
│                      ndex=0 ons?entryIstiugges/:id/sonflict/api/cT │  GE   │
                                                                 │   
      │                                 ions oom SuggestEP 1: Get R  ST───────┐
│─────────────────────────────────────────────────────────┌─────     ▼
                              │
                                ─────┘
 ──────────────────────────────────────────────────────────────      │
└──          ACE       ERFNTENT ITMNUAL ADJUSMA               ┐
│     ────────────────────────────────────────────────────────────────────`
┌─ow

``ment Workfldjust Manual A

##
```

---──────────┘──────────────────────────────────────────────────────  │
└─────              e)     lab availablitable rning (No suMachine Lea   │
│  •                                                      led:     
│  Fai   │                                                                  
│     │                                       01t → CR3evelopmen  • Web D       │
│                                4 ems → LAB10e Syst  • Databas │
│                                             → LAB103ms thgori│
│  • Al                                   B102      → LAes ctur Data Stru     │
│  •                                                  signments: │
│  As                                                                 │            │
                                      ds   : 2.5 seconationDur      │
│                                             Rate: 80%    Success 
│   │                                         al: 1 ⚠️   Manuquires │  Re     │
                              4 ✅      ved: Resolcessfully │  Suc        │
                                       5    ffected: l Aota │
│  T                                                                     
│       │               MMARY       ENERATION SU    REG              
│    ──────┐────────────────────────────────────────────────────────────     ▼
┌───                              │
                                ──────┘
 ────────────────────────────────────────────────────────────│
└───                      ts)   (45 studenS-A section udents: C    └─ St│
│                                           th Smiculty: Dr.     ├─ Fa │
│                                          ed Users   Affectify Not7.│  │
                                                                  
│                │               '        change'Room statusreason: ─  └  
│        │                                        LAB102 newRoom:     ├─       │
│                                  01      LAB1ldRoom: ─ o│
│     ├                          tion'    eraegenauto_rgeType: '   ├─ chan
│       │                                                Log to Audit
│  6.     │                                                                     │
│              ent  ssignmesManualArequirnflictId,  co└─ Clear:│
│                                    lse       ffected = fa─ Set: isA   ├  
││                                         = LAB102omRef  ├─ Set: ro  │
│                                   y         able EntrUpdate Timet│  5.        │
                                                                  │
│                       121)       : AB102 (Scored: L └─ Selecte    │
│                             st Score)   atch (Highet Melect Bes4. S   │
│                                                                   │
│     