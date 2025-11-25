import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { User } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

// Fix for default markers in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Profile {
  id: string;
  full_name: string;
  skill_level?: string;
  activities?: string[];
  distance?: number;
  location_lat?: number;
  location_lng?: number;
}

interface MapViewProps {
  userLocation: { lat: number; lng: number } | null;
  buddies: Profile[];
  distanceFilter: number;
}

// Component to handle map recentering
const RecenterMap = ({ center }: { center: LatLngExpression }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const MapView: React.FC<MapViewProps> = ({ userLocation, buddies, distanceFilter }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !userLocation) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          {!userLocation 
            ? "Please set your location in your profile to view the map."
            : "Loading map..."}
        </p>
      </Card>
    );
  }

  const center: LatLngExpression = [userLocation.lat, userLocation.lng];
  const buddiesWithLocation = buddies.filter(
    buddy => buddy.location_lat && buddy.location_lng
  );

  // Convert distance filter from km to meters for circle radius
  const radiusInMeters = distanceFilter * 1000;

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <RecenterMap center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User's location marker (red) */}
        <Marker position={center} icon={defaultIcon}>
          <Popup>
            <div className="text-sm">
              <strong>Your Location</strong>
            </div>
          </Popup>
        </Marker>

        {/* Distance circle */}
        <Circle
          center={center}
          radius={radiusInMeters}
          pathOptions={{
            color: 'hsl(var(--primary))',
            fillColor: 'hsl(var(--primary))',
            fillOpacity: 0.1,
            weight: 2,
          }}
        />

        {/* Buddy markers (blue) with clustering */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            let size = 'small';
            if (count > 10) size = 'large';
            else if (count > 5) size = 'medium';
            
            const sizeMap = {
              small: { width: 30, height: 30, fontSize: 12 },
              medium: { width: 40, height: 40, fontSize: 14 },
              large: { width: 50, height: 50, fontSize: 16 }
            };
            
            const { width, height, fontSize } = sizeMap[size as keyof typeof sizeMap];
            
            return new Icon({
              html: `
                <div style="
                  background: hsl(220, 70%, 50%);
                  border-radius: 50%;
                  width: ${width}px;
                  height: ${height}px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: ${fontSize}px;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">
                  ${count}
                </div>
              `,
              className: 'custom-cluster-icon',
              iconSize: [width, height],
              iconAnchor: [width / 2, height / 2],
            });
          }}
        >
          {buddiesWithLocation.map((buddy) => (
            <Marker
              key={buddy.id}
              position={[buddy.location_lat!, buddy.location_lng!]}
              icon={new Icon({
                iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
                    <path fill="hsl(220, 70%, 50%)" d="M12 0C7.031 0 3 4.031 3 9c0 6.75 9 18 9 18s9-11.25 9-18c0-4.969-4.031-9-9-9z"/>
                    <circle cx="12" cy="9" r="4" fill="white"/>
                  </svg>
                `),
                iconSize: [24, 36],
                iconAnchor: [12, 36],
                popupAnchor: [0, -36],
              })}
            >
              <Popup>
                <div className="text-sm space-y-2">
                  <div className="font-semibold">{buddy.full_name}</div>
                  {buddy.skill_level && (
                    <Badge variant="secondary" className="text-xs">
                      {buddy.skill_level}
                    </Badge>
                  )}
                  {buddy.distance && (
                    <p className="text-muted-foreground">
                      ~{buddy.distance.toFixed(1)} km away
                    </p>
                  )}
                  {buddy.activities && buddy.activities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {buddy.activities.map((activity, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs capitalize">
                          {activity}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default MapView;
