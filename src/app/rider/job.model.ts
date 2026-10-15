// Same field names as the backend endpoint GET /api/jobs/:jobCode,
// so swapping the mock for the real API later only touches job.service.ts.
export interface JobStop {
  sequence: number;
  customer: string;
  phone: string;
  boxes: number;
  lat: number;
  lng: number;
  mapUrl: string;
}

export interface JobSheet {
  job_code: string;
  rider: string;
  total_boxes: number;
  total_distance_km: number;
  total_time_min: number;
  stops: JobStop[];
  fullRouteUrl: string;
}
