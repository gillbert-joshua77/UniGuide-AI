import React, { useEffect, useState, useCallback } from 'react'
import axiosInstance from '../Utils/axiosInstance'

const MODE_META = {
  internship: { title: 'Internship', emoji: '💼' },
  hackathon: { title: 'Hackathon', emoji: '🚀' },
  university: { title: 'University / College', emoji: '🎓' },
}

const MODE_SUMMARY_PREFIX = {
  internship: 'I need internship guidance.',
  hackathon: 'I want to participate in a hackathon. Here are my details:',
  university: 'I need help choosing a university or college. Here are my details:',
}

const MODE_SUMMARY_SUFFIX = {
  internship:
    'Please start a guided conversation to help me find the right internship. Read my profile first and ask me any important questions before giving recommendations.',
  hackathon:
    'Based on my profile, suggest suitable hackathons, a project idea, and how to prepare.',
  university:
    'Based on my profile, suggest suitable universities, programs, and my next steps.',
}

const FIELD_LABELS = {
  target_role: 'Target Role',
  skills: 'Skills',
  experience_level: 'Experience Level',
  preferred_location: 'Preferred Location',
  work_mode: 'Work Mode',
  company_preference: 'Company Preference',
  duration: 'Duration',
  stipend_preference: 'Stipend Preference',
  availability: 'Availability',
  career_goal: 'Career Goal',
  domain: 'Domain',
  technologies: 'Technologies',
  team_preference: 'Team Preference',
  team_status: 'Team Status',
  format: 'Format',
  project_idea: 'Project Idea',
  country: 'Country',
  state_region: 'State/Region',
  degree_level: 'Degree Level',
  course_field: 'Course / Field',
  academic_score: 'Academic Score',
  budget: 'Budget',
  budget_currency: 'Budget Currency',
  entrance_exam: 'Entrance Exams',
  scholarship_needed: 'Scholarship',
  first_degree: 'First Degree',
  previous_degree: 'Previous Degree',
  work_experience: 'Work Experience',
  research_experience: 'Research Experience',
  accommodation: 'Accommodation',
  language_proficiency: 'Language Proficiency',
}

function buildPrompt(mode, answers) {
  const prefix = MODE_SUMMARY_PREFIX[mode] || ''
  const suffix = MODE_SUMMARY_SUFFIX[mode] || ''
  const lines = Object.entries(answers)
    .filter(([, v]) => v)
    .map(([k, v]) => `${FIELD_LABELS[k] || k}: ${v}`)
  return `${prefix}\n${lines.join('\n')}\n${suffix}`
}

const GuidedOptionsModal = ({ mode, onClose, onComplete }) => {
  const [answers, setAnswers] = useState({})
  const [history, setHistory] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [textValue, setTextValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stepNumber, setStepNumber] = useState(0)
  const [estimatedTotal, setEstimatedTotal] = useState(null)

  const meta = MODE_META[mode]

  const fetchNextQuestion = useCallback(
    async (currentAnswers, currentHistory) => {
      setLoading(true)
      setError('')
      try {
        const askedFields = currentHistory.map((h) => h.field)
        const res = await axiosInstance.post('uniguide/chat/guided-question/', {
          mode,
          answers: currentAnswers,
          asked_fields: askedFields,
        })

        const data = res.data

        if (data.status === 'complete') {
          onComplete(buildPrompt(mode, { ...currentAnswers, ...(data.summary || {}) }))
          return
        }

        if (data.status === 'need_more_information') {
          setCurrentQuestion(data)
          setStepNumber(currentHistory.length + 1)
          if (data.estimated_remaining) {
            setEstimatedTotal(currentHistory.length + 1 + data.estimated_remaining)
          }
          return
        }

        setError('Unexpected response from server')
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          'Failed to get next question. Please try again.'
        setError(msg)
      } finally {
        setLoading(false)
      }
    },
    [mode, onComplete]
  )

  useEffect(() => {
    if (mode) {
      setAnswers({})
      setHistory([])
      setCurrentQuestion(null)
      setTextValue('')
      setError('')
      setStepNumber(0)
      setEstimatedTotal(null)
      fetchNextQuestion({}, [])
    }
  }, [mode, fetchNextQuestion])

  if (!mode || !meta) return null

  const advance = (newAnswers, field) => {
    const entry = { field, value: newAnswers[field] }
    const newHistory = [...history, entry]
    setAnswers(newAnswers)
    setHistory(newHistory)
    setTextValue('')
    setCurrentQuestion(null)
    fetchNextQuestion(newAnswers, newHistory)
  }

  const handleSelect = (value) => {
    if (!currentQuestion) return
    advance({ ...answers, [currentQuestion.field]: value }, currentQuestion.field)
  }

  const handleMultiSelectToggle = (value) => {
    if (!currentQuestion) return
    const field = currentQuestion.field
    const current = answers[field]
    const arr = Array.isArray(current) ? current : current ? [current] : []
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
    setAnswers({ ...answers, [field]: next.join(', ') })
  }

  const handleTextNext = () => {
    if (!currentQuestion) return
    const value = textValue.trim()
    if (!value && !currentQuestion.optional) return
    advance({ ...answers, [currentQuestion.field]: value }, currentQuestion.field)
  }

  const handleNumberNext = () => {
    if (!currentQuestion) return
    const value = textValue.trim()
    if (!value && !currentQuestion.optional) return
    advance({ ...answers, [currentQuestion.field]: value }, currentQuestion.field)
  }

  const goBack = () => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    const newHistory = history.slice(0, -1)
    setHistory(newHistory)
    setCurrentQuestion(null)
    setTextValue(answers[prev.field] || '')
    setStepNumber(newHistory.length)

    // Re-fetch with the previous state
    setLoading(true)
    setError('')
    const askedFields = newHistory.map((h) => h.field)
    axiosInstance
      .post('uniguide/chat/guided-question/', {
        mode,
        answers,
        asked_fields: askedFields,
      })
      .then((res) => {
        const data = res.data
        if (data.status === 'complete') {
          onComplete(buildPrompt(mode, { ...answers, ...(data.summary || {}) }))
        } else if (data.status === 'need_more_information') {
          setCurrentQuestion(data)
        } else {
          setError('Unexpected response')
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.error || 'Failed to go back')
      })
      .finally(() => setLoading(false))
  }

  const handleSkip = () => {
    if (!currentQuestion || !currentQuestion.optional) return
    advance({ ...answers, [currentQuestion.field]: '' }, currentQuestion.field)
  }

  const progressLabel =
    estimatedTotal && stepNumber
      ? `Question ${stepNumber} of ~${estimatedTotal}`
      : stepNumber
      ? `Question ${stepNumber}`
      : ''

  const showNextBtn =
    currentQuestion &&
    !loading &&
    !error &&
    (currentQuestion.type === 'multi_choice' ||
      currentQuestion.type === 'text' ||
      currentQuestion.type === 'number')

  const nextDisabled =
    currentQuestion &&
    (currentQuestion.type === 'text' || currentQuestion.type === 'number') &&
    !textValue.trim() &&
    !currentQuestion.optional

  const handleNextClick = () => {
    if (!currentQuestion) return
    if (currentQuestion.type === 'number') handleNumberNext()
    else handleTextNext()
  }

  return (
    <div className="guided-modal-overlay" onClick={onClose}>
      <div className="guided-modal" onClick={(e) => e.stopPropagation()}>
        <div className="guided-modal-header">
          <div className="guided-modal-title">
            {meta.emoji} {meta.title}
          </div>
          <button className="guided-modal-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="guided-modal-body">
          {loading && !currentQuestion && (
            <div className="guided-loading">
              <div className="guided-loading-spinner" />
              <span>Thinking...</span>
            </div>
          )}

          {error && (
            <div className="guided-error">
              <span>{error}</span>
              <button className="guided-retry-btn" onClick={() => { setError(''); fetchNextQuestion(answers, history) }}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && currentQuestion && (
            <>
              {progressLabel && (
                <div className="guided-step">{progressLabel}</div>
              )}

              <div className="guided-question">{currentQuestion.question}</div>

              {currentQuestion.type === 'single_choice' && currentQuestion.options && (
                <div className={`guided-options-list ${currentQuestion.options.length > 8 ? 'guided-scrollable' : ''}`}>
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option}
                      className={`guided-option-chip ${answers[currentQuestion.field] === option ? 'selected' : ''}`}
                      onClick={() => handleSelect(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'multi_choice' && currentQuestion.options && (
                <div className="guided-options-list guided-multi">
                  {currentQuestion.options.map((option) => {
                    const selected = (answers[currentQuestion.field] || '')
                      .split(', ')
                      .includes(option)
                    return (
                      <button
                        key={option}
                        className={`guided-option-chip ${selected ? 'selected' : ''}`}
                        onClick={() => handleMultiSelectToggle(option)}
                      >
                        {selected && <span className="guided-check">✓</span>}
                        {option}
                      </button>
                    )
                  })}
                </div>
              )}

              {(currentQuestion.type === 'text' || currentQuestion.type === 'number') && (
                <input
                  className="guided-input"
                  autoFocus
                  type={currentQuestion.type === 'number' ? 'number' : 'text'}
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (currentQuestion.type === 'number') handleNumberNext()
                      else handleTextNext()
                    }
                  }}
                  placeholder={currentQuestion.placeholder || 'Type your answer...'}
                />
              )}
            </>
          )}
        </div>

        <div className="guided-bottom-actions">
          {history.length > 0 && (
            <button className="guided-back-btn" onClick={goBack}>
              ← Back
            </button>
          )}
          {currentQuestion && currentQuestion.optional && (
            <button className="guided-skip-btn" onClick={handleSkip}>
              Skip
            </button>
          )}
          <button className="guided-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          {showNextBtn && (
            <button
              className="guided-next-btn"
              onClick={handleNextClick}
              disabled={nextDisabled}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GuidedOptionsModal
