import React from 'react';
import { GoogleFacilityMap } from './GoogleFacilityMap';
import { Facility, RedistributionItem } from '../../types';

interface FacilityMapProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onSelectFacility: (fac: Facility) => void;
  country: string;
  state?: string;
  district?: string;
  redistributions?: RedistributionItem[];
}

export const FacilityMap: React.FC<FacilityMapProps> = (props) => {
  return <GoogleFacilityMap {...props} />;
};


export default FacilityMap;
