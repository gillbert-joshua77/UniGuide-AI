import React, { useEffect, useState } from 'react'

const nextLevelQuestion = (level) => {
  if (level === 'Undergraduate (UG)') return 'entrance'
  if (level === 'Postgraduate (PG)') return 'workExp'
  if (level === 'PhD') return 'research'
  return null
}

const GUIDED_FLOWS = {
  internship: {
    title: 'Internship',
    emoji: '💼',
    start: 'role',
    questions: {
      role: {
        text: 'What type of internship role are you targeting?',
        type: 'text',
        placeholder: 'e.g., AI Engineer, Frontend Developer, Data Analyst',
        next: null,
      },
    },
  },
  hackathon: {
    title: 'Hackathon',
    emoji: '🚀',
    start: 'domain',
    questions: {
      domain: {
        text: 'Which domain interests you?',
        type: 'select',
        options: ['AI/ML', 'Web development', 'Mobile apps', 'Blockchain', 'IoT', 'Cybersecurity', 'Any'],
        next: 'skills',
      },
      skills: {
        text: 'What skills will you bring to the hackathon?',
        type: 'text',
        placeholder: 'e.g., Python, UI design, pitching',
        next: 'technologies',
      },
      technologies: {
        text: 'Which technologies do you want to use?',
        type: 'text',
        placeholder: 'e.g., React, Node.js, TensorFlow',
        next: 'teamPref',
      },
      teamPref: {
        text: 'Do you want to participate solo or in a team?',
        type: 'select',
        options: ['Team', 'Solo', 'Not sure'],
        next: (answers) => (answers.teamPref === 'Team' ? 'teamReady' : 'location'),
      },
      teamReady: {
        text: 'Do you already have a team?',
        type: 'select',
        options: ['Yes, we have a team', 'No, I need a team'],
        next: 'location',
      },
      location: {
        text: 'Preferred location for the hackathon?',
        type: 'text',
        placeholder: 'e.g., Chennai, or Anywhere',
        next: 'format',
      },
      format: {
        text: 'Online or offline?',
        type: 'select',
        options: ['Online', 'Offline', 'Either'],
        next: 'experience',
      },
      experience: {
        text: 'Your hackathon experience level?',
        type: 'select',
        options: ['None', 'Beginner', 'Intermediate', 'Advanced'],
        next: null,
      },
    },
  },
  university: {
    title: 'University / College',
    emoji: '🎓',
    start: 'degreeLevel',
    questions: {
      degreeLevel: {
        text: 'Which level are you planning to study?',
        type: 'select',
        options: ['Undergraduate (UG)', 'Postgraduate (PG)', 'PhD'],
        next: 'courseField',
      },
      courseField: {
        text: 'Which course or field do you want to pursue?',
        type: 'text',
        placeholder: 'e.g., Computer Science, Business',
        next: 'location',
      },
      location: {
        text: 'Preferred country or location for study?',
        type: 'text',
        placeholder: 'e.g., Canada, Germany, or Any',
        next: 'score',
      },
      score: {
        text: 'What is your academic score?',
        type: 'text',
        placeholder: 'e.g., CGPA 8.5/10, 85%, GPA 3.7/4',
        next: 'budget',
      },
      budget: {
        text: 'What is your budget per year?',
        type: 'text',
        placeholder: 'e.g., $15,000/year',
        next: 'firstDegree',
      },
      firstDegree: {
        text: 'Is this your first degree?',
        type: 'select',
        options: ['Yes, this is my first degree', 'No, I already have a degree'],
        next: (answers) => {
          if (answers.firstDegree === 'No, I already have a degree') return 'prevDegree'
          return nextLevelQuestion(answers.degreeLevel)
        },
      },
      prevDegree: {
        text: 'What was your previous degree or field?',
        type: 'text',
        placeholder: 'e.g., B.Com, Mechanical Engineering',
        next: 'switchReason',
      },
      switchReason: {
        text: 'Why are you pursuing another degree?',
        type: 'text',
        placeholder: 'e.g., career switch, upskilling',
        next: (answers) => nextLevelQuestion(answers.degreeLevel),
      },
      entrance: {
        text: 'Which entrance exams are you preparing for?',
        type: 'text',
        placeholder: 'e.g., JEE, SAT, CUET',
        optional: true,
        next: null,
      },
      workExp: {
        text: 'How many years of work experience do you have?',
        type: 'select',
        options: ['None', '0-1 years', '1-2 years', '2+ years'],
        next: null,
      },
      research: {
        text: 'Do you have research experience or publications?',
        type: 'select',
        options: ['No', 'Some coursework projects', 'Published papers'],
        next: null,
      },
    },
  },
}

const GUIDED_SUMMARY = {
  internship: {
    prefix: 'I need internship guidance.',
    suffix: 'Please start a guided conversation to help me find the right internship. Read my profile first and ask me any important questions before giving recommendations.',
    fields: [
      ['role', 'Target role'],
    ],
  },
  hackathon: {
    prefix: 'I want to participate in a hackathon. Here are my details:',
    suffix: 'Based on my profile, suggest suitable hackathons, a project idea, and how to prepare.',
    fields: [
      ['domain', 'Domain'],
      ['skills', 'Skills'],
      ['technologies', 'Technologies'],
      ['teamPref', 'Team preference'],
      ['teamReady', 'Existing team'],
      ['location', 'Location'],
      ['format', 'Format'],
      ['experience', 'Experience'],
    ],
  },
  university: {
    prefix: 'I need help choosing a university or college. Here are my details:',
    suffix: 'Based on my profile, suggest suitable universities, programs, and my next steps.',
    fields: [
      ['degreeLevel', 'Degree level'],
      ['courseField', 'Course / Field'],
      ['location', 'Preferred location'],
      ['score', 'Academic score'],
      ['budget', 'Budget'],
      ['firstDegree', 'First degree?'],
      ['prevDegree', 'Previous degree'],
      ['switchReason', 'Reason for another degree'],
      ['entrance', 'Entrance exams'],
      ['workExp', 'Work experience'],
      ['research', 'Research experience'],
    ],
  },
}

const buildGuidedPrompt = (mode, answers) => {
  const summary = GUIDED_SUMMARY[mode]
  const lines = summary.fields
    .filter(([id]) => answers[id])
    .map(([id, label]) => `${label}: ${answers[id]}`)
  return `${summary.prefix}\n${lines.join('\n')}\n${summary.suffix}`
}

const GuidedOptionsModal = ({ mode, onClose, onComplete }) => {
  const [answers, setAnswers] = useState({})
  const [history, setHistory] = useState([])
  const [currentId, setCurrentId] = useState(null)
  const [textValue, setTextValue] = useState('')

  useEffect(() => {
    if (mode) {
      setAnswers({})
      setHistory([])
      setTextValue('')
      setCurrentId(GUIDED_FLOWS[mode].start)
    }
  }, [mode])

  if (!mode) return null

  const flow = GUIDED_FLOWS[mode]
  const question = flow.questions[currentId]
  if (!question) return null

  const stepIndex = history.length + 1

  const advance = (nextAnswers) => {
    const q = flow.questions[currentId]
    const nextId = typeof q.next === 'function' ? q.next(nextAnswers) : q.next
    setAnswers(nextAnswers)
    setTextValue('')
    if (nextId) {
      setHistory((prev) => [...prev, currentId])
      setCurrentId(nextId)
    } else {
      onComplete(buildGuidedPrompt(mode, nextAnswers))
    }
  }

  const handleSelect = (value) => {
    advance({ ...answers, [currentId]: value })
  }

  const handleTextNext = () => {
    const value = textValue.trim()
    if (!value && !question.optional) return
    advance({ ...answers, [currentId]: value })
  }

  const goBack = () => {
    const prevId = history[history.length - 1]
    if (!prevId) return
    setCurrentId(prevId)
    setTextValue(answers[prevId] || '')
    setHistory(history.slice(0, -1))
  }

  return (
    <div className="guided-modal-overlay" onClick={onClose}>
      <div className="guided-modal" onClick={(e) => e.stopPropagation()}>
        <div className="guided-modal-header">
          <div className="guided-modal-title">{flow.emoji} {flow.title}</div>
          <button className="guided-modal-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="guided-step">Question {stepIndex}</div>
        <div className="guided-question">{question.text}</div>

        {question.type === 'select' ? (
          <div className="guided-options-list">
            {question.options.map((option) => (
              <button key={option} className="guided-option-chip" onClick={() => handleSelect(option)}>
                {option}
              </button>
            ))}
          </div>
        ) : (
          <input
            className="guided-input"
            autoFocus
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleTextNext()
              }
            }}
            placeholder={question.placeholder || 'Type your answer...'}
          />
        )}

        {(history.length > 0 || question.type === 'text') && (
          <div className="guided-modal-actions">
            {history.length > 0 && (
              <button className="guided-back-btn" onClick={goBack}>← Back</button>
            )}
            {question.type === 'text' && (
              <button
                className="guided-next-btn"
                onClick={handleTextNext}
                disabled={!textValue.trim() && !question.optional}
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default GuidedOptionsModal
