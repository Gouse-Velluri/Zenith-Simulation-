'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/store/app'

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { user, updateUser } = useAppStore()
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(user?.name || '')
      setBio(user?.bio || '')
      setError('')
    }
  }, [open, user?.name, user?.bio])

  const handleSave = async () => {
    if (!user?.id) return

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name: name.trim(), bio: bio.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update profile')
        return
      }

      const updatedUser = await res.json()
      updateUser({ name: updatedUser.name, bio: updatedUser.bio })
      onOpenChange(false)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1a1f36] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white text-lg">Edit Profile</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update your operator profile information.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-gray-300 text-sm">Display Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus-visible:border-[#6c5ce7] focus-visible:ring-[#6c5ce7]/30"
              maxLength={50}
            />
          </div>

          {/* Email (read-only) */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-gray-300 text-sm">Email</Label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">Email cannot be changed.</p>
          </div>

          {/* Role (read-only) */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-gray-300 text-sm">Role</Label>
            <Input
              value={user?.role || 'STUDENT'}
              disabled
              className="bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-gray-300 text-sm">Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus-visible:border-[#6c5ce7] focus-visible:ring-[#6c5ce7]/30 min-h-[80px] resize-none"
              maxLength={300}
            />
            <p className="text-xs text-gray-500 text-right">{bio.length}/300</p>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#6c5ce7] hover:bg-[#5a4bd6] text-white"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}