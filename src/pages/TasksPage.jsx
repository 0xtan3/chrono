import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { ITEMS as DEFAULT_ITEMS, CATS as DEFAULT_CATS, WEEK_GROUPS as DEFAULT_WEEK_GROUPS } from '../utils/roadmapData';
import { parseRoadmapFile } from '../utils/roadmapParser';
import styles from './TasksPage.module.css';


function WeeklyStatsHub({ activeCategories, activeItems, tasks, selectedWeek }) {
  const weekItems = activeItems.filter(item => item.week === selectedWeek);
  const totalWeekItems = weekItems.length;

  const completedWeekItems = weekItems.filter(item =>
    tasks.some(t => t.completed && (t.roadmapId === item.id || t.title.toLowerCase() === item.label.toLowerCase()))
  ).length;

  const completionPct = totalWeekItems > 0 ? Math.round((completedWeekItems / totalWeekItems) * 100) : 0;

  const radius = 38;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * completionPct) / 100;

  const categoryStats = Object.keys(activeCategories).map((catKey) => {
    const catInfo = activeCategories[catKey] || { label: catKey, color: '#a5b4fc' };
    const sessions = tasks
      .filter(t => t.category === catKey)
      .reduce((sum, t) => sum + (t.sessionsCompleted || 0), 0);
    return { key: catKey, label: catInfo.label, color: catInfo.color, sessions };
  });

  const totalSessions = categoryStats.reduce((sum, item) => sum + item.sessions, 0);
  const activeStats = categoryStats.filter(item => item.sessions > 0).sort((a, b) => b.sessions - a.sessions);

  return (
    <div className={styles.statsHubCard}>
      <div className={styles.statsHubLeft}>
        <div className={styles.progressRingWrap}>
          <svg viewBox="0 0 100 100" className={styles.progressRing}>
            <circle cx="50" cy="50" r={radius} strokeWidth={strokeWidth} className={styles.progressRingBg} />
            <circle
              cx="50" cy="50" r={radius} strokeWidth={strokeWidth}
              className={styles.progressRingFill}
              style={{ strokeDasharray: circumference, strokeDashoffset }}
            />
            <text x="50%" y="54%" textAnchor="middle" className={styles.progressRingText}>{completionPct}%</text>
          </svg>
        </div>
        <div className={styles.ringLabelWrap}>
          <h4 className={styles.ringLabelTitle}>Week Targets</h4>
          <span className={styles.ringLabelSub}>{completedWeekItems} of {totalWeekItems} completed</span>
        </div>
      </div>

      <div className={styles.statsHubRight}>
        <h4 className={styles.focusDistributionTitle}>⏱️ Category Focus Time</h4>
        {activeStats.length === 0 ? (
          <div className={styles.noDistribution}>
            <span className={styles.noDistributionIcon}>⌛</span>
            <p className={styles.noDistributionText}>No session data logged yet. Focus on tasks to view learning time breakdown.</p>
          </div>
        ) : (
          <div className={styles.distributionBars}>
            {activeStats.slice(0, 3).map((stat) => {
              const barWidth = totalSessions > 0 ? (stat.sessions / totalSessions) * 100 : 0;
              return (
                <div key={stat.key} className={styles.distributionRow}>
                  <div className={styles.distMetaRow}>
                    <span className={styles.distLabel} style={{ color: stat.color }}>{stat.label}</span>
                    <span className={styles.distValue}>{stat.sessions} Pomos</span>
                  </div>
                  <div className={styles.distBarBg}>
                    <div className={styles.distBarFill} style={{ width: `${barWidth}%`, backgroundColor: stat.color, boxShadow: `0 0 6px ${stat.color}60` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Roadmap Item Modal ────────────────────────────────────────────────────
function AddRoadmapItemModal({ activeCategories, activeWeeks, onClose, addRoadmapItem }) {
  const [label, setLabel] = useState('');
  const [cat, setCat] = useState(Object.keys(activeCategories)[0] || '');
  const [src, setSrc] = useState('web');
  const [url, setUrl] = useState('');
  const [week, setWeek] = useState(activeWeeks[0]?.key || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!label.trim() || !week) return;
    addRoadmapItem({ label: label.trim(), cat, src, url: url.trim(), week });
    onClose();
  };

  const srcOptions = [
    { v: 'yt', l: '▶ YouTube' },
    { v: 'll', l: '💼 LinkedIn Learning' },
    { v: 'ud', l: '🎓 Udemy' },
    { v: 'nc', l: '🔵 NeetCode' },
    { v: 'web', l: '🌐 Web / Docs' },
    { v: 'fr', l: '🆓 Free Resource' },
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>📌 Add Roadmap Item</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Topic / Course Title</label>
            <input
              className={styles.modalInput}
              placeholder="e.g. Docker Security: Container Hardening"
              value={label}
              onChange={e => setLabel(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.modalRow}>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Category</label>
              <select className={styles.modalSelect} value={cat} onChange={e => setCat(e.target.value)}>
                {Object.entries(activeCategories).map(([k, c]) => (
                  <option key={k} value={k}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Week</label>
              <select className={styles.modalSelect} value={week} onChange={e => setWeek(e.target.value)}>
                {activeWeeks.map(w => (
                  <option key={w.key} value={w.key}>{w.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.modalRow}>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Source Platform</label>
              <select className={styles.modalSelect} value={src} onChange={e => setSrc(e.target.value)}>
                {srcOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>

            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Reference URL <span className={styles.optionalTag}>(optional)</span></label>
              <input
                className={styles.modalInput}
                placeholder="https://..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                type="url"
              />
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.modalCancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.modalSubmitBtn}>+ Add to Roadmap</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Week Modal ────────────────────────────────────────────────────────────
function AddWeekModal({ activeWeeks, onClose, addRoadmapWeek }) {
  const nextNum = (activeWeeks.length + 1);
  const [weekKey, setWeekKey] = useState(`Wk${nextNum}`);
  const [weekLabel, setWeekLabel] = useState(`Week ${nextNum}: `);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weekKey.trim() || !weekLabel.trim()) return;
    if (activeWeeks.some(w => w.key === weekKey.trim())) {
      setError('A week with this key already exists.');
      return;
    }
    addRoadmapWeek(weekKey.trim(), weekLabel.trim());
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>📅 New Week</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Week Key <span className={styles.optionalTag}>(unique ID, e.g. Wk13)</span></label>
            <input
              className={styles.modalInput}
              value={weekKey}
              onChange={e => { setWeekKey(e.target.value); setError(''); }}
              placeholder="Wk13"
              required
            />
          </div>

          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Week Label</label>
            <input
              className={styles.modalInput}
              value={weekLabel}
              onChange={e => setWeekLabel(e.target.value)}
              placeholder="Week 13: Advanced Topics"
              required
              autoFocus
            />
          </div>

          {error && <p className={styles.modalError}>{error}</p>}

          <div className={styles.modalActions}>
            <button type="button" className={styles.modalCancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.modalSubmitBtn}>Create Week</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Tasks Page ─────────────────────────────────────────────────────────
export default function TasksPage() {
  const tasks = useStore(s => s.tasks || []);
  const activeTaskId = useStore(s => s.activeTaskId);
  const addTask = useStore(s => s.addTask);
  const toggleTaskCompleted = useStore(s => s.toggleTaskCompleted);
  const deleteTask = useStore(s => s.deleteTask);
  const setActiveTaskId = useStore(s => s.setActiveTaskId);
  const importWeekTasks = useStore(s => s.importWeekTasks);
  const importSingleTask = useStore(s => s.importSingleTask);
  const totalXP = useStore(s => s.totalXP);
  const user = useStore(s => s.user);
  const streak = useStore(s => s.streak);
  const lastActiveDate = useStore(s => s.lastActiveDate);

  // Custom Roadmap State
  const customRoadmap = useStore(s => s.customRoadmap);
  const setCustomRoadmap = useStore(s => s.setCustomRoadmap);
  const resetCustomRoadmap = useStore(s => s.resetCustomRoadmap);
  const addRoadmapItem = useStore(s => s.addRoadmapItem);
  const addRoadmapWeek = useStore(s => s.addRoadmapWeek);
  const deleteRoadmapItem = useStore(s => s.deleteRoadmapItem);
  const loadDefaultRoadmap = useStore(s => s.loadDefaultRoadmap);

  // Resolve active dataset.
  // activeItems/activeWeeks are EMPTY for new users (no default roadmap forced on anyone).
  // Users must explicitly load a template or import a file to get a roadmap.
  // activeCategories keeps DEFAULT_CATS as fallback so the task creation form always has options.
  const activeCategories = customRoadmap ? customRoadmap.categories : DEFAULT_CATS;
  const activeItems = useMemo(() => customRoadmap
    ? [...(customRoadmap.items || []), ...(customRoadmap.includeDefaults ? DEFAULT_ITEMS : [])]
    : [], [customRoadmap]);
  const activeWeeks = useMemo(() => customRoadmap
    ? [...(customRoadmap.weeks || []), ...(customRoadmap.includeDefaults ? DEFAULT_WEEK_GROUPS : [])]
    : [], [customRoadmap]);
  const hasRoadmap = customRoadmap !== null;

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCat, setNewCat] = useState('foundations');
  const [newDesc, setNewDesc] = useState('');

  // Filters & Week selector
  const [taskFilter, setTaskFilter] = useState('active');
  const [selectedWeek, setSelectedWeek] = useState('Wk1');
  const [errorMsg, setErrorMsg] = useState('');

  // Modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddWeekModal, setShowAddWeekModal] = useState(false);

  const fileInputRef = useRef(null);

  // Auto-correction: if selectedWeek disappears, reset
  useEffect(() => {
    const firstWeekKey = activeWeeks[0]?.key || '';
    if (!activeWeeks.some(w => w.key === selectedWeek)) {
      setSelectedWeek(firstWeekKey);
    }
  }, [activeWeeks, selectedWeek]);

  useEffect(() => {
    const catKeys = Object.keys(activeCategories);
    if (!catKeys.includes(newCat) && catKeys.length > 0) {
      setNewCat(catKeys[0]);
    }
  }, [activeCategories, newCat]);

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTask(newTitle.trim(), newDesc.trim(), newCat);
    setNewTitle('');
    setNewDesc('');
  };

  const currentWeekItems = activeItems.filter(item => item.week === selectedWeek);
  const weekImportedCount = currentWeekItems.filter(item =>
    tasks.some(t => t.roadmapId === item.id || t.title.toLowerCase() === item.label.toLowerCase())
  ).length;

  const handleBulkImport = () => importWeekTasks(selectedWeek, currentWeekItems);

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'active') return !t.completed;
    if (taskFilter === 'completed') return t.completed;
    return true;
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseRoadmapFile(event.target.result, file.name);
        setCustomRoadmap(parsed);
        setErrorMsg('');
      } catch (err) {
        setErrorMsg(err.message || 'Failed to parse roadmap file.');
      }
    };
    reader.onerror = () => setErrorMsg('Error reading roadmap file.');
    reader.readAsText(file);
    e.target.value = '';
  };

  const srcLabel = (src) => {
    const map = { ll: 'LinkedIn', yt: 'YouTube', ud: 'Udemy', nc: 'NeetCode', fr: 'Free', web: 'Web' };
    return map[src] || 'Web';
  };

  // Is this a custom (user-added) item? (id starts with 'custom_')
  const isCustomItem = (item) => item.id?.startsWith('custom_');

  return (
    <div className={styles.dashboardViewport}>
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />

      {/* Modals */}
      {showAddItemModal && (
        <AddRoadmapItemModal
          activeCategories={activeCategories}
          activeWeeks={activeWeeks}
          onClose={() => setShowAddItemModal(false)}
          addRoadmapItem={addRoadmapItem}
        />
      )}
      {showAddWeekModal && (
        <AddWeekModal
          activeWeeks={activeWeeks}
          onClose={() => setShowAddWeekModal(false)}
          addRoadmapWeek={(key, label) => {
            // Bootstrap custom roadmap from defaults if needed, then add week
            if (!customRoadmap) {
              setCustomRoadmap({ categories: DEFAULT_CATS, items: [], weeks: [], includeDefaults: true });
            }
            addRoadmapWeek(key, label);
          }}
        />
      )}

      {/* Header Panel */}
      <header className={styles.topHeader}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.backBtn} aria-label="Back to Timer" title="Back to Timer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <div>
            <h1 className={styles.title}>Study Hub</h1>
            <span className={styles.subtitle}>
              {customRoadmap ? '📂 My Roadmap' : '📭 No Roadmap Yet'}
            </span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.roadmapActionsWrap}>
            {customRoadmap && (
              <button onClick={resetCustomRoadmap} className={styles.resetBtn}>Clear Roadmap</button>
            )}
            <button onClick={() => fileInputRef.current?.click()} className={styles.uploadBtn}>
              Import File
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".html,.htm,.json" style={{ display: 'none' }} />
          </div>

          <div className={styles.xpPill}>
            <span className={styles.xpGlow}>✨</span>
            <span className={styles.xpText}>{totalXP} XP</span>
          </div>
        </div>
      </header>

      {/* Streak Warning Banner */}
      {streak > 0 && lastActiveDate !== new Date().toISOString().split('T')[0] && (
        <div className={styles.streakWarningBanner}>
          <span className={styles.warningFlash}>🔥</span>
          <span>
            {user
              ? `Streak Warning: Complete a task focus session today to save your ${streak}-day streak!`
              : `Streak Warning: You are not logged in! Log in and focus on a task today to save your ${streak}-day streak!`}
          </span>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className={styles.errorAlert}>
          <span className={styles.errorIcon}>⚠️</span>
          <p className={styles.errorText}>{errorMsg}</p>
          <button onClick={() => setErrorMsg('')} className={styles.errorDismissBtn}>&times;</button>
        </div>
      )}

      {/* Grid Layout */}
      <div className={styles.mainGrid}>

        {/* LEFT: Tasks Queue */}
        <section className={styles.tasksSection}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionHeading}>My Tasks Queue</h2>
            <div className={styles.filterGroup}>
              <button className={`${styles.filterBtn} ${taskFilter === 'active' ? styles.filterBtnActive : ''}`} onClick={() => setTaskFilter('active')}>
                Active ({tasks.filter(t => !t.completed).length})
              </button>
              <button className={`${styles.filterBtn} ${taskFilter === 'completed' ? styles.filterBtnActive : ''}`} onClick={() => setTaskFilter('completed')}>
                Done ({tasks.filter(t => t.completed).length})
              </button>
              <button className={`${styles.filterBtn} ${taskFilter === 'all' ? styles.filterBtnActive : ''}`} onClick={() => setTaskFilter('all')}>
                All
              </button>
            </div>
          </div>

          {/* Quick Create */}
          <div className={styles.glassCard}>
            <form onSubmit={handleCreateTask} className={styles.taskForm}>
              <div className={styles.formRow}>
                <input
                  type="text"
                  placeholder="Set your focus target..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={styles.textInput}
                  required
                />
                <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className={styles.selectInput}>
                  {Object.entries(activeCategories).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.label}</option>
                  ))}
                </select>
                <button type="submit" className={styles.addBtn}>Add Task</button>
              </div>
              <input
                type="text"
                placeholder="Add optional notes, docs, or resource links here..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className={styles.noteInput}
              />
            </form>
          </div>

          {/* Tasks List */}
          <div className={styles.tasksList}>
            {filteredTasks.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🎯</span>
                <p className={styles.emptyText}>
                  {taskFilter === 'active'
                    ? 'Your queue is empty! Select a week on the right to import tasks, or create a custom task above.'
                    : taskFilter === 'completed'
                    ? 'No completed tasks yet. Finish a task in focus mode to earn +50 XP bonus!'
                    : 'No tasks here.'}
                </p>
              </div>
            ) : (
              filteredTasks.map(task => {
                const isActive = activeTaskId === task.id;
                const catInfo = activeCategories[task.category] || { label: task.category, color: '#a5b4fc' };
                return (
                  <div
                    key={task.id}
                    className={`${styles.taskItem} ${isActive ? styles.taskItemActive : ''} ${task.completed ? styles.taskItemCompleted : ''}`}
                    style={{ '--cat-color': catInfo.color }}
                  >
                    <div className={styles.taskLeft}>
                      <button
                        className={`${styles.checkCircle} ${task.completed ? styles.checkCircleChecked : ''}`}
                        onClick={() => toggleTaskCompleted(task.id)}
                      >
                        {task.completed && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>

                      <div className={styles.taskDetails}>
                        <div className={styles.taskTitleRow}>
                          <h3 className={styles.taskTitle}>{task.title}</h3>
                          <span className={styles.categoryBadge} style={{ backgroundColor: `${catInfo.color}15`, color: catInfo.color, borderColor: `${catInfo.color}35` }}>
                            {catInfo.label}
                          </span>
                        </div>
                        {/* Only show user-written notes, never the auto-generated "Source: ..." strings */}
                        {task.description && !task.description.startsWith('Source:') && (
                          <p className={styles.taskDesc}>{task.description}</p>
                        )}
                        <div className={styles.progressSection}>
                          {task.sessionsCompleted > 0 && (
                            <div className={styles.sessionDots}>
                              {Array.from({ length: task.sessionsCompleted }).map((_, i) => (
                                <span key={i} className={`${styles.sessDot} ${styles.sessDotFilled}`} style={{ backgroundColor: catInfo.color }} />
                              ))}
                            </div>
                          )}
                          <span className={styles.progressText}>{task.sessionsCompleted} Pomos completed</span>
                          {task.referenceUrl && (
                            <a
                              href={task.referenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.refLink}
                              title="Open reference course"
                            >
                              ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.taskActions}>
                      {!task.completed && (
                        <button
                          className={`${styles.actionBtn} ${isActive ? styles.activeFocusBtn : ''}`}
                          onClick={() => setActiveTaskId(isActive ? null : task.id)}
                        >
                          {isActive ? 'Active 🎯' : 'Focus'}
                        </button>
                      )}
                      <button className={styles.deleteBtn} onClick={() => deleteTask(task.id)} title="Delete Task">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT: Roadmap Tracker */}
        <section className={styles.roadmapSection}>

          <WeeklyStatsHub
            activeCategories={activeCategories}
            activeItems={activeItems}
            tasks={tasks}
            selectedWeek={selectedWeek}
          />

          {!hasRoadmap ? (
            /* ── Get Started Panel (shown to users with no roadmap) ──────────── */
            <div className={styles.getStartedPanel}>
              <div className={styles.getStartedIcon}>🗺️</div>
              <h3 className={styles.getStartedTitle}>Set Up Your Roadmap</h3>
              <p className={styles.getStartedSub}>
                Your roadmap is personal — add your own courses, plan your weeks, and track your learning progress.
              </p>
              <div className={styles.getStartedActions}>
                <button
                  className={styles.templateBtn}
                  onClick={loadDefaultRoadmap}
                >
                  <span>⚡</span>
                  Use DevSecOps Template
                </button>
                <button
                  className={styles.freshBtn}
                  onClick={() => setCustomRoadmap({ categories: DEFAULT_CATS, items: [], weeks: [], includeDefaults: false })}
                >
                  <span>✏️</span>
                  Start Fresh
                </button>
              </div>
              <p className={styles.getStartedHint}>Or click <strong>Import File</strong> above to load a roadmap file.</p>
            </div>
          ) : (
            <>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.sectionHeading}>Weekly Roadmap</h2>
                  <span className={styles.weekImportInfo}>
                    {weekImportedCount} / {currentWeekItems.length} tasks imported
                  </span>
                </div>

                <div className={styles.weekSelectorWrap}>
                  {activeWeeks.length > 0 ? (
                    <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className={styles.weekSelect}>
                      {activeWeeks.map(g => (
                        <option key={g.key} value={g.key}>{g.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={styles.noWeeksText}>No weeks yet — add one below</span>
                  )}

                  <button
                    onClick={handleBulkImport}
                    disabled={currentWeekItems.length === 0 || weekImportedCount === currentWeekItems.length}
                    className={styles.bulkImportBtn}
                  >
                    Bulk Import
                  </button>
                </div>
              </div>

          {/* Roadmap edit toolbar */}
          <div className={styles.roadmapEditBar}>
            <button className={styles.addItemBtn} onClick={() => setShowAddItemModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Item to Roadmap
            </button>
            <button className={styles.addWeekBtn} onClick={() => setShowAddWeekModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                <line x1="12" y1="14" x2="12" y2="20" /><line x1="9" y1="17" x2="15" y2="17" />
              </svg>
              New Week
            </button>
          </div>

          {/* Roadmap list items */}
          <div className={styles.roadmapList}>
            {currentWeekItems.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📭</span>
                <p className={styles.emptyText}>No items for this week yet.<br />Click <strong>+ Add Item to Roadmap</strong> above to get started.</p>
              </div>
            ) : (
              currentWeekItems.map(item => {
                const isAlreadyImported = tasks.some(t => t.roadmapId === item.id || t.title.toLowerCase() === item.label.toLowerCase());
                const catInfo = activeCategories[item.cat] || { label: item.cat, color: '#a5b4fc' };
                const custom = isCustomItem(item);

                return (
                  <div key={item.id} className={`${styles.roadmapCard} ${isAlreadyImported ? styles.roadmapCardImported : ''}`} style={{ borderLeftColor: catInfo.color }}>
                    <div className={styles.roadmapCardLeft}>
                      <div className={styles.roadmapCardTitleRow}>
                        <h4 className={styles.roadmapItemLabel}>{item.label}</h4>
                        <span className={styles.categoryBadge} style={{ backgroundColor: `${catInfo.color}12`, color: catInfo.color, borderColor: `${catInfo.color}25` }}>
                          {catInfo.label}
                        </span>
                      </div>

                      <div className={styles.roadmapMetaRow}>
                        <span className={`${styles.sourceBadge} ${styles[`source_${item.src}`] || ''}`}>
                          {srcLabel(item.src)}
                        </span>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                            Reference Course ↗
                          </a>
                        )}
                        {custom && <span className={styles.customTag}>✏️ Custom</span>}
                      </div>
                    </div>

                    <div className={styles.roadmapCardRight}>
                      {isAlreadyImported ? (
                        <span className={styles.importedTag}>✓ Added</span>
                      ) : (
                        <button onClick={() => importSingleTask(item)} className={styles.importBtn}>+ Add</button>
                      )}
                      {custom && (
                        <button onClick={() => deleteRoadmapItem(item.id)} className={styles.deleteRoadmapBtn} title="Remove from roadmap">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
            </>
          )}
        </section>

      </div>
    </div>
  );
}
