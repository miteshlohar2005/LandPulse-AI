import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GISFeature } from '../types';

interface ProjectMapLeafletProps {
  features?: GISFeature[];
  projects?: any[];
  selectedProject?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    risk_score: number;
    risk_category: string;
    current_stage: string;
  };
  center?: [number, number];
  zoom?: number;
  onSelectProject?: (projectId: string) => void;
  height?: string;
}

export const ProjectMapLeaflet: React.FC<ProjectMapLeafletProps> = ({
  features = [],
  projects = [],
  selectedProject,
  center,
  zoom,
  onSelectProject,
  height = '100%'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const getRiskColor = (cat: string) => {
    switch (cat) {
      case 'CRITICAL': return '#DC2626';
      case 'HIGH': return '#F97316';
      case 'MEDIUM': return '#F59E0B';
      default: return '#10B981';
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultLat = center ? center[0] : selectedProject ? selectedProject.latitude : 23.3441;
    const defaultLon = center ? center[1] : selectedProject ? selectedProject.longitude : 85.3096;
    const defaultZoom = zoom ? zoom : selectedProject ? 11 : 5;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLon],
      zoom: defaultZoom,
      scrollWheelZoom: true
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | LandGuard AI DoLR',
      maxZoom: 18,
    }).addTo(map);

    // If a selected single project is provided
    if (selectedProject) {
      const color = getRiskColor(selectedProject.risk_category);
      const marker = L.circleMarker([selectedProject.latitude, selectedProject.longitude], {
        radius: 12,
        fillColor: color,
        color: '#FFFFFF',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.5; min-width: 180px;">
          <div style="font-weight: bold; color: #0F382A; margin-bottom: 2px;">${selectedProject.id}</div>
          <div style="color: #475569; font-size: 11px; margin-bottom: 6px;">${selectedProject.name}</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #64748B;">Risk:</span>
            <span style="font-weight: bold; color: ${color};">${selectedProject.risk_category} (${selectedProject.risk_score}/10)</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748B;">Stage:</span>
            <span style="font-weight: 600; color: #334155;">${selectedProject.current_stage}</span>
          </div>
        </div>
      `).openPopup();

      L.circle([selectedProject.latitude, selectedProject.longitude], {
        radius: 3000,
        color: color,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.12
      }).addTo(map);
    }

    // If projects array is provided
    if (projects && projects.length > 0) {
      projects.forEach((proj: any) => {
        if (!proj.latitude || !proj.longitude) return;

        const color = getRiskColor(proj.risk_category);
        const marker = L.circleMarker([proj.latitude, proj.longitude], {
          radius: 9,
          fillColor: color,
          color: '#FFFFFF',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 180px;">
            <div style="font-weight: bold; color: #0F382A;">${proj.id}</div>
            <div style="font-size: 11px; color: #334155; margin-bottom: 4px;">${proj.name}</div>
            <div style="color: #64748B; font-size: 10px;">${proj.state} • ${proj.district}</div>
            <div style="margin-top: 4px; display: flex; justify-content: space-between;">
              <span style="font-weight: bold; color: ${color};">${proj.risk_category} (${proj.risk_score}/10)</span>
              <span style="font-weight: 600;">${proj.current_stage}</span>
            </div>
          </div>
        `);

        marker.on('click', () => {
          if (onSelectProject) {
            onSelectProject(proj.id);
          }
        });
      });
    }

    // If geojson features are provided
    if (features && features.length > 0) {
      features.forEach((feature) => {
        const lat = feature.latitude;
        const lon = feature.longitude;
        if (!lat || !lon) return;

        const color = getRiskColor(feature.risk_category);

        const marker = L.circleMarker([lat, lon], {
          radius: 8,
          fillColor: color,
          color: '#FFFFFF',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 170px;">
            <div style="font-weight: bold; color: #0F382A;">${feature.id}</div>
            <div style="font-size: 11px; color: #334155; margin-bottom: 4px;">${feature.name}</div>
            <div style="color: #64748B; font-size: 10px;">${feature.district}, ${feature.state}</div>
            <div style="margin-top: 4px; display: flex; justify-content: space-between;">
              <span style="font-weight: bold; color: ${color};">${feature.risk_category} (${feature.risk_score}/10)</span>
              <span style="font-weight: 600;">${feature.current_stage}</span>
            </div>
          </div>
        `);

        marker.on('click', () => {
          if (onSelectProject) {
            onSelectProject(feature.id);
          }
        });
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [features, projects, selectedProject, center, zoom]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%', borderRadius: '1rem', minHeight: '240px' }}
      className="shadow-inner border border-warm-200"
    />
  );
};
