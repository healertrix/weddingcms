export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          content: string
          created_at: string | null
          featured_image_key: string | null
          gallery_images: string[] | null
          id: string
          is_featured_blog: boolean | null
          is_featured_home: boolean | null
          location: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string | null
          wedding_date: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          featured_image_key?: string | null
          gallery_images?: string[] | null
          id?: string
          is_featured_blog?: boolean | null
          is_featured_home?: boolean | null
          location?: string | null
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string | null
          wedding_date?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          featured_image_key?: string | null
          gallery_images?: string[] | null
          id?: string
          is_featured_blog?: boolean | null
          is_featured_home?: boolean | null
          location?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string | null
          wedding_date?: string | null
        }
        Relationships: []
      }
      blogs: {
        Row: {
          id: string
          title: string
          slug: string
          content: string | null
          featured_image_key: string | null
          featured_image_alt: string | null
          status: string
          published_at: string | null
          created_at: string | null
          updated_at: string | null
          is_featured_home: boolean | null
          is_featured_blog: boolean | null
          gallery_images: string[] | null
          gallery_image_alts: Record<string, unknown> | null
          video_url: string | null
          meta_description: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content?: string | null
          featured_image_key?: string | null
          featured_image_alt?: string | null
          status?: string
          published_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_featured_home?: boolean | null
          is_featured_blog?: boolean | null
          gallery_images?: string[] | null
          gallery_image_alts?: Record<string, unknown> | null
          video_url?: string | null
          meta_description?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: string | null
          featured_image_key?: string | null
          featured_image_alt?: string | null
          status?: string
          published_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_featured_home?: boolean | null
          is_featured_blog?: boolean | null
          gallery_images?: string[] | null
          gallery_image_alts?: Record<string, unknown> | null
          video_url?: string | null
          meta_description?: string | null
        }
        Relationships: []
      }
      cms_users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
        }
        Relationships: []
      }
      films: {
        Row: {
          couple_names: string
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          status: string
          title: string | null
          updated_at: string | null
          video_url: string | null
          wedding_date: string | null
        }
        Insert: {
          couple_names: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          status?: string
          title?: string | null
          updated_at?: string | null
          video_url?: string | null
          wedding_date?: string | null
        }
        Update: {
          couple_names?: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          status?: string
          title?: string | null
          updated_at?: string | null
          video_url?: string | null
          wedding_date?: string | null
        }
        Relationships: []
      }
      Test: {
        Row: {
          created_at: string
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          couple_names: string
          created_at: string | null
          id: string
          image_key: string | null
          location: string | null
          review: string | null
          status: string
          updated_at: string | null
          video_url: string | null
          wedding_date: string | null
        }
        Insert: {
          couple_names: string
          created_at?: string | null
          id?: string
          image_key?: string | null
          location?: string | null
          review?: string | null
          status?: string
          updated_at?: string | null
          video_url?: string | null
          wedding_date?: string | null
        }
        Update: {
          couple_names?: string
          created_at?: string | null
          id?: string
          image_key?: string | null
          location?: string | null
          review?: string | null
          status?: string
          updated_at?: string | null
          video_url?: string | null
          wedding_date?: string | null
        }
        Relationships: []
      }
      weddings: {
        Row: {
          couple_names: string
          created_at: string | null
          featured_image_key: string | null
          gallery_images: string[] | null
          id: string
          is_featured_home: boolean | null
          location: string | null
          status: string
          updated_at: string | null
          wedding_date: string | null
        }
        Insert: {
          couple_names: string
          created_at?: string | null
          featured_image_key?: string | null
          gallery_images?: string[] | null
          id?: string
          is_featured_home?: boolean | null
          location?: string | null
          status?: string
          updated_at?: string | null
          wedding_date?: string | null
        }
        Update: {
          couple_names?: string
          created_at?: string | null
          featured_image_key?: string | null
          gallery_images?: string[] | null
          id?: string
          is_featured_home?: boolean | null
          location?: string | null
          status?: string
          updated_at?: string | null
          wedding_date?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_admin_status: {
        Args: {
          user_email: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "editor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
