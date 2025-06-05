export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          branding_config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          branding_config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          branding_config?: Json
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          client_id: string
          name: string
          description: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      personas: {
        Row: {
          id: string
          project_id: string
          name: string
          csv_file_path: string | null
          raw_data: Json | null
          enriched_data: Json | null
          summary: string | null
          demographics: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          csv_file_path?: string | null
          raw_data?: Json | null
          enriched_data?: Json | null
          summary?: string | null
          demographics?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          csv_file_path?: string | null
          raw_data?: Json | null
          enriched_data?: Json | null
          summary?: string | null
          demographics?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          persona_id: string
          user_id: string
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          persona_id: string
          user_id: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          persona_id?: string
          user_id?: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: Json
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          project_id: string
          persona_id: string | null
          type: 'insights' | 'campaign' | 'media_planning' | 'infographic'
          title: string
          content: Json
          file_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          persona_id?: string | null
          type: 'insights' | 'campaign' | 'media_planning' | 'infographic'
          title: string
          content: Json
          file_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          persona_id?: string | null
          type?: 'insights' | 'campaign' | 'media_planning' | 'infographic'
          title?: string
          content?: Json
          file_url?: string | null
          created_at?: string
        }
      }
      user_clients: {
        Row: {
          id: string
          user_id: string
          client_id: string
          role: 'admin' | 'member' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          role?: 'admin' | 'member' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          role?: 'admin' | 'member' | 'viewer'
          created_at?: string
        }
      }
    }
  }
}