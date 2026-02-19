import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react'
import { useAuth }    from '@/context/AuthContext'
import { Button }     from '@/components/ui/button'
import { Input }      from '@/components/ui/input'
import { Label }      from '@/components/ui/label'
import { useToast }   from '@/components/ui/toast'

function strengthScore(pwd: string): { score: number; label: string; color: string } {
  let score = 0
  if (pwd.length >= 8)               score++
  if (/[A-Z]/.test(pwd))             score++
  if (/[a-z]/.test(pwd))             score++
  if (/[0-9]/.test(pwd))             score++
  if (/[^A-Za-z0-9]/.test(pwd))      score++

  const map: Record<number, { label: string; color: string }> = {
    0: { label: 'Very weak',  color: 'bg-red-500'    },
    1: { label: 'Weak',       color: 'bg-red-400'    },
    2: { label: 'Fair',       color: 'bg-orange-400' },
    3: { label: 'Good',       color: 'bg-yellow-400' },
    4: { label: 'Strong',     color: 'bg-green-400'  },
    5: { label: 'Very strong',color: 'bg-green-600'  },
  }
  return { score, ...map[score] }
}

export function PasswordResetPage() {
  const { user }      = useAuth()
  const navigate      = useNavigate()
  const { toast }     = useToast()

  const [newPwd,     setNewPwd]     = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showNew,    setShowNew]    = useState(false)
  const [showConf,   setShowConf]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [errors,     setErrors]     = useState<{ newPwd?: string; confirmPwd?: string }>({})

  if (!user) {
    navigate('/login', { replace: true })
    return null
  }

  const strength = strengthScore(newPwd)

  const validate = () => {
    const errs: typeof errors = {}
    if (newPwd.length < 8)              errs.newPwd = 'Password must be at least 8 characters'
    else if (!/[A-Z]/.test(newPwd))     errs.newPwd = 'Must contain at least one uppercase letter'
    else if (!/[a-z]/.test(newPwd))     errs.newPwd = 'Must contain at least one lowercase letter'
    else if (!/[0-9]/.test(newPwd))     errs.newPwd = 'Must contain at least one number'
    else if (!/[^A-Za-z0-9]/.test(newPwd)) errs.newPwd = 'Must contain at least one special character'
    if (newPwd !== confirmPwd)          errs.confirmPwd = 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 800)) // mock
    toast('Password updated successfully. Please select your region.', 'success')
    setLoading(false)
    navigate('/region-select', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          {/* Header */}
          <div className="px-8 pt-8 pb-5 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-200 mb-4">
              <KeyRound className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Set Your Password</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Welcome, <strong>{user.fullName}</strong>!
              This is your first login. Please set a new password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="px-8 pb-8 space-y-4">
            {/* New password */}
            <div className="space-y-1.5">
              <Label htmlFor="new-pwd">New password</Label>
              <div className="relative">
                <Input
                  id="new-pwd"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={newPwd}
                  onChange={e => { setNewPwd(e.target.value); setErrors(p => ({ ...p, newPwd: undefined })) }}
                  error={errors.newPwd}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowNew(s => !s)}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {newPwd.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1 h-1.5">
                    {[1,2,3,4,5].map(n => (
                      <div
                        key={n}
                        className={`flex-1 rounded-full transition-all ${n <= strength.score ? strength.color : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label htmlFor="conf-pwd">Confirm password</Label>
              <div className="relative">
                <Input
                  id="conf-pwd"
                  type={showConf ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPwd}
                  onChange={e => { setConfirmPwd(e.target.value); setErrors(p => ({ ...p, confirmPwd: undefined })) }}
                  error={errors.confirmPwd}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowConf(s => !s)}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showConf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPwd && newPwd === confirmPwd && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Requirements hint */}
            <ul className="text-xs text-gray-500 space-y-0.5 bg-gray-50 rounded-lg px-3 py-2.5">
              {[
                { check: newPwd.length >= 8,           text: 'At least 8 characters'    },
                { check: /[A-Z]/.test(newPwd),         text: 'One uppercase letter'      },
                { check: /[a-z]/.test(newPwd),         text: 'One lowercase letter'      },
                { check: /[0-9]/.test(newPwd),         text: 'One number'                },
                { check: /[^A-Za-z0-9]/.test(newPwd), text: 'One special character'     },
              ].map(r => (
                <li key={r.text} className={`flex items-center gap-1.5 ${r.check ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{r.check ? '✓' : '○'}</span>
                  {r.text}
                </li>
              ))}
            </ul>

            <Button type="submit" className="w-full" loading={loading}>
              {loading ? 'Saving…' : 'Set Password & Continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
