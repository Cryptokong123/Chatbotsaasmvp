'use client'

import { useEffect, useState } from 'react'
import { Users, UserPlus, Mail, Trash2, Shield, Eye, UserCog, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatRelativeTime } from '@/lib/utils'
import { TeamListSkeleton } from '@/components/skeletons'

interface TeamMember {
  id: string
  user_id: string
  role: string
  joined_at: string
  created_at: string
  user: {
    id: string
    email: string
    raw_user_meta_data: any
  }
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
}

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  member: UserCog,
  viewer: Eye,
}

const ROLE_COLORS = {
  owner: 'text-yellow-600 bg-yellow-100',
  admin: 'text-purple-600 bg-purple-100',
  member: 'text-blue-600 bg-blue-100',
  viewer: 'text-gray-600 bg-gray-100',
}

const ROLE_DESCRIPTIONS = {
  owner: 'Full access and control',
  admin: 'Can manage team and settings',
  member: 'Can view and edit content',
  viewer: 'Can only view content',
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('member')
  const [invitationLink, setInvitationLink] = useState('')
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    setLoading(true)
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        fetch('/api/team/members'),
        fetch('/api/team/invitations'),
      ])

      const membersData = await membersRes.json()
      const invitationsData = await invitationsRes.json()

      setMembers(membersData.members || [])
      setInvitations(invitationsData.invitations || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch team data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)

    try {
      const response = await fetch('/api/team/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send invitation')
      }

      setInvitationLink(data.invitationLink)
      toast({
        title: 'Success',
        description: `Invitation sent to ${inviteEmail}`,
      })

      setInviteEmail('')
      setInviteRole('member')
      fetchTeamData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    try {
      const response = await fetch(`/api/team/members?memberId=${memberToRemove.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to remove team member')
      }

      toast({
        title: 'Success',
        description: 'Team member removed successfully',
      })

      setMemberToRemove(null)
      fetchTeamData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/team/invitations?invitationId=${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to revoke invitation')
      }

      toast({
        title: 'Success',
        description: 'Invitation revoked successfully',
      })

      fetchTeamData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink)
    toast({
      title: 'Copied!',
      description: 'Invitation link copied to clipboard',
    })
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Management</h1>
              <p className="text-gray-600">Invite team members and manage access to your workspace</p>
            </div>
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <CardTitle>Team Members</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <TeamListSkeleton />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Management</h1>
            <p className="text-gray-600">
              Invite team members and manage access to your workspace
            </p>
          </div>
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Team Members */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <CardTitle>Team Members ({members.length})</CardTitle>
          </div>
          <CardDescription>People who have access to your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => {
              const RoleIcon = ROLE_ICONS[member.role as keyof typeof ROLE_ICONS]
              const roleColor = ROLE_COLORS[member.role as keyof typeof ROLE_COLORS]

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {member.user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user.raw_user_meta_data?.full_name || member.user.email}
                      </p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Joined {formatRelativeTime(member.joined_at || member.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${roleColor}`}>
                      <RoleIcon className="h-4 w-4" />
                      <span className="text-sm font-medium capitalize">{member.role}</span>
                    </div>
                    {member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMemberToRemove(member)}
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.filter(i => i.status === 'pending').length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-500" />
              <CardTitle>Pending Invitations ({invitations.filter(i => i.status === 'pending').length})</CardTitle>
            </div>
            <CardDescription>Invitations waiting to be accepted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations
                .filter((inv) => inv.status === 'pending')
                .map((invitation) => {
                  const RoleIcon = ROLE_ICONS[invitation.role as keyof typeof ROLE_ICONS]
                  const roleColor = ROLE_COLORS[invitation.role as keyof typeof ROLE_COLORS]

                  return (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{invitation.email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Invited {formatRelativeTime(invitation.created_at)} • Expires {formatRelativeTime(invitation.expires_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${roleColor}`}>
                          <RoleIcon className="h-4 w-4" />
                          <span className="text-sm font-medium capitalize">{invitation.role}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeInvitation(invitation.id)}
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      {showInviteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Invite Team Member</CardTitle>
              <CardDescription>Send an invitation to join your workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    disabled={inviting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole} disabled={inviting}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin - {ROLE_DESCRIPTIONS.admin}</SelectItem>
                      <SelectItem value="member">Member - {ROLE_DESCRIPTIONS.member}</SelectItem>
                      <SelectItem value="viewer">Viewer - {ROLE_DESCRIPTIONS.viewer}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {invitationLink && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-900 mb-2">Invitation Created!</p>
                    <div className="flex gap-2">
                      <Input value={invitationLink} readOnly className="text-xs" />
                      <Button type="button" size="sm" onClick={copyInvitationLink}>
                        Copy
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={inviting} className="flex-1">
                    {inviting ? 'Sending...' : 'Send Invitation'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowInviteDialog(false)
                      setInviteEmail('')
                      setInviteRole('member')
                      setInvitationLink('')
                    }}
                  >
                    Close
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Remove Member Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberToRemove?.user.email}</strong> from your team?
              They will lose access to all bots and conversations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-red-600 hover:bg-red-700">
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
