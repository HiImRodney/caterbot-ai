// Basic database types for Kitchen Wizard AI
// This would normally be generated from Supabase CLI

export interface Database {
  public: {
    Tables: {
      sites: {
        Row: {
          id: string;
          business_name: string;
          business_type: string;
          country: string;
          plan: string;
          created_at: string;
          updated_at: string;
        };
      };
      site_equipment: {
        Row: {
          id: string;
          site_id: string;
          equipment_type_id: string;
          qr_code: string;
          internal_name: string;
          current_status: string;
          performance_rating: number;
          is_critical_equipment: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      equipment_catalog: {
        Row: {
          equipment_type_id: string;
          display_name: string;
          manufacturer: string;
          category: string;
          has_decision_tree: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      equipment_locations: {
        Row: {
          id: string;
          site_id: string;
          location_name: string;
          area_type: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}
