export interface LinkedInTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_token_expires_in?: number
  scope: string
}

export interface LinkedInProfile {
  sub: string
  name: string
  given_name: string
  family_name: string
  picture: string
  email: string
  email_verified: boolean
}

export interface LinkedInPublishResult {
  success: boolean
  postUrn?: string
  error?: unknown
}

export interface LinkedInAccount {
  id: string
  user_id: string
  linkedin_person_urn: string
  linkedin_name: string | null
  linkedin_email: string | null
  linkedin_picture_url: string | null
  access_token: string
  refresh_token: string | null
  token_expires_at: string
  scopes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PostStatus = 'draft' | 'pending' | 'publishing' | 'published' | 'failed'

export interface Post {
  id: string
  user_id: string
  linkedin_account_id: string
  content: string
  visibility: string
  status: PostStatus
  scheduled_at: string | null
  published_at: string | null
  linkedin_post_urn: string | null
  error_message: string | null
  retry_count: number
  template_id: string | null
  created_at: string
  updated_at: string
  linkedin_accounts?: LinkedInAccount
}

export interface Template {
  id: string
  user_id: string
  name: string
  content: string
  category: string | null
  created_at: string
  updated_at: string
}
