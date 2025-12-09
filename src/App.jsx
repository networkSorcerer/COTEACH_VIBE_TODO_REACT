import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:5000/todos'

function App() {
  const [todos, setTodos] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const sortedTodos = useMemo(
    () => [...todos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [todos]
  )

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error('할일을 불러오는데 실패했습니다.')
      const data = await res.json()
      setTodos(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('제목은 필수입니다.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const payload = { title: title.trim(), description: description.trim() }
      const res = await fetch(editingId ? `${API_URL}/${editingId}` : API_URL, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('저장에 실패했습니다.')
      const saved = await res.json()
      setTodos((prev) =>
        editingId ? prev.map((t) => (t._id === saved._id ? saved : t)) : [saved, ...prev]
      )
      resetForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (todo) => {
    setEditingId(todo._id)
    setTitle(todo.title)
    setDescription(todo.description || '')
  }

  const toggleComplete = async (todo) => {
    setError('')
    try {
      const res = await fetch(`${API_URL}/${todo._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      })
      if (!res.ok) throw new Error('완료 상태 변경에 실패했습니다.')
      const updated = await res.json()
      setTodos((prev) => prev.map((t) => (t._id === updated._id ? updated : t)))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    setError('')
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제에 실패했습니다.')
      setTodos((prev) => prev.filter((t) => t._id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>할일 관리</h1>
        <p>localhost:5000 API와 연동된 간단한 CRUD</p>
      </header>

      <section className="card">
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">제목 *</label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 홈 화면 디자인 정리"
              disabled={submitting}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="description">설명</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="세부 내용이나 메모를 적어주세요"
              rows={3}
              disabled={submitting}
            />
          </div>
          <div className="actions">
            {editingId && (
              <button type="button" className="ghost" onClick={resetForm} disabled={submitting}>
                취소
              </button>
            )}
            <button type="submit" disabled={submitting}>
              {editingId ? '수정하기' : '추가하기'}
            </button>
          </div>
        </form>
        {error && <div className="error">{error}</div>}
      </section>

      <section className="card">
        <div className="card-header">
          <h2>할일 목록</h2>
          <button className="ghost" onClick={fetchTodos} disabled={loading}>
            새로고침
          </button>
        </div>
        {loading ? (
          <div className="empty">불러오는 중...</div>
        ) : sortedTodos.length === 0 ? (
          <div className="empty">할일이 없습니다. 새로 추가해보세요.</div>
        ) : (
          <ul className="todo-list">
            {sortedTodos.map((todo) => (
              <li key={todo._id} className={`todo ${todo.completed ? 'done' : ''}`}>
                <div className="todo-main">
                  <input
                    type="checkbox"
                    checked={!!todo.completed}
                    onChange={() => toggleComplete(todo)}
                    aria-label="완료"
                  />
                  <div className="todo-text" onDoubleClick={() => handleEdit(todo)}>
                    <h3>{todo.title}</h3>
                    {todo.description && <p>{todo.description}</p>}
                    <small>
                      {todo.createdAt
                        ? new Date(todo.createdAt).toLocaleString()
                        : '생성일 정보 없음'}
                    </small>
                  </div>
                </div>
                <div className="todo-actions">
                  <button className="ghost" onClick={() => handleEdit(todo)}>
                    수정
                  </button>
                  <button className="danger" onClick={() => handleDelete(todo._id)}>
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default App
