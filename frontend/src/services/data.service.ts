// src/services/data.service.ts

import { axiosInstance } from "./auth.service";
import {getCsrfToken} from "./auth.service";

const replaceEmptyStrings = (obj: any) => {
    for (const key in obj) {
      if (obj[key] === "") {
        obj[key] = null;
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        replaceEmptyStrings(obj[key]);
      }
    }
  };

export interface SwatchInfo {
  width: number;
  height: number;
  stitches: number;
  rows: number;
  needle_size: number;
}

export interface TorsoDimensions {
  width: number;
  height: number;
  ribbing?: string;
  taper_offset?: number;
  taper_hem?: number;
  neck_offset_width?: number;
  neck_offset_height?: number;
  neck_depth?: number;
}

export interface SleeveDimensions {
  width: number;
  height: number;
  ribbing?: string;
  taper_offset?: number;
  taper_hem?: number;
  taper_style?: string;
  neck_offset_width?: number;
  neck_offset_height?: number;
  neck_depth?: number;
}

export interface CompilePatternData {
  name: string;
  content: string;
  pattern_type: string;
  swatch: SwatchInfo;
  torso_projection: TorsoDimensions;
  sleeve_projection: SleeveDimensions;
}

export const compilePattern = async (data: CompilePatternData) => {
  try {
    // Append the pattern name to swatchInfo's name field with "swatch"
    const updatedData = {
      ...data,
      swatch: {
        ...data.swatch,
        name: `${data.name} Swatch` // Add "swatch" to the pattern name
      }
    };

    replaceEmptyStrings(updatedData);

    // Debug
    console.log("Updated Data:", updatedData);

    const csrfToken = getCsrfToken();
    const response = await axiosInstance.post('/api/pattern-compile/', updatedData, {
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'An error occurred while compiling the pattern.');
  }
};

export const fetchPatternData = async ({patternId, fileName, viewMode}: { patternId: any, fileName: any, viewMode: any }) => {
  try {
  console.log("fetchPatternData called with:", { patternId, fileName, viewMode });

  const csrfToken = getCsrfToken();
  const encodedFileName = encodeURIComponent(fileName);
  const encodedViewMode = encodeURIComponent(viewMode);

  const response = await axiosInstance.get(
      `/patterns/${encodeURIComponent(patternId)}/file`, // Encode dynamic segment
      {
        headers: {
          'X-CSRFToken': csrfToken,
        },
        params: {
          file_name: encodedFileName, // Encode query parameter
          view_mode: encodedViewMode, // Encode query parameter
        },
      }
    );

  return response.data.grid_data; // Ensure you return the right data
  } catch (error: any) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch pattern file.');
  }
};

interface SavePatternChangesParams {
  patternId: string;
  fileName: string;
  viewMode: string;
  changes: any; // Define a more specific type if possible
}

export const savePatternChanges = async ({
  patternId,
  fileName,
  viewMode,
  changes
}: SavePatternChangesParams): Promise<any> => {
  try {
    const csrfToken = getCsrfToken();

    // Use encodeURIComponent for dynamic segments in the URL if needed
    const encodedPatternId = encodeURIComponent(patternId);

    const response = await axiosInstance.post(
      `/patterns/${encodedPatternId}/save_changes`, // Encode dynamic segment
      {
        file_name: encodeURIComponent(fileName), // Encode in the body, though not strictly necessary for JSON fields
        view_mode: encodeURIComponent(viewMode), // Encode in the body, though not strictly necessary for JSON fields
        changes: changes,
      },
      {
        headers: {
          'X-CSRFToken': csrfToken,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to save pattern changes.');
  }
};