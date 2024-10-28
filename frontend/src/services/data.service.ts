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