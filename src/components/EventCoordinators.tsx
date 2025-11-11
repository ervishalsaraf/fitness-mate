import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone } from "lucide-react";

interface Coordinator {
  id?: string;
  name: string;
  contact_info: string;
  display_order: number;
}

interface EventCoordinatorsProps {
  groupId: string;
  isVisible: boolean;
}

export const EventCoordinators = ({ groupId, isVisible }: EventCoordinatorsProps) => {
  const [coords, setCoords] = useState<Coordinator[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isVisible && !loaded) {
      supabase
        .from('event_coordinators')
        .select('*')
        .eq('group_id', groupId)
        .order('display_order')
        .then(({ data }) => {
          setCoords(data || []);
          setLoaded(true);
        });
    }
  }, [isVisible, loaded, groupId]);

  if (coords.length === 0) {
    return <p className="text-xs text-muted-foreground">No coordinators added yet</p>;
  }

  return (
    <>
      {coords.map((coord) => (
        <div key={coord.id} className="text-xs p-2 bg-muted rounded-md space-y-1">
          <div className="font-medium">{coord.name}</div>
          <div className="flex items-center gap-2 text-muted-foreground">
            {coord.contact_info.includes('@') ? (
              <a href={`mailto:${coord.contact_info}`} className="flex items-center gap-1 hover:text-primary">
                <Mail className="h-3 w-3" />
                {coord.contact_info}
              </a>
            ) : (
              <a href={`tel:${coord.contact_info}`} className="flex items-center gap-1 hover:text-primary">
                <Phone className="h-3 w-3" />
                {coord.contact_info}
              </a>
            )}
          </div>
        </div>
      ))}
    </>
  );
};
