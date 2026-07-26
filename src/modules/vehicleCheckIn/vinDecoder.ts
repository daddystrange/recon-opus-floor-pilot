export type DecodedVehicle = {
  vin: string;
  year: string;
  make: string;
  model: string;
  trim?: string;
};

export interface VinDecoder {
  decode(vin: string): Promise<DecodedVehicle>;
}

export const DEMO_VIN = '1FTFW1E50RFA10421';

export const demoVinDecoder: VinDecoder = {
  async decode(vin) {
    return {
      vin: vin.trim().toUpperCase(),
      year: '2024',
      make: 'Ford',
      model: 'F-150',
      trim: 'Lariat',
    };
  },
};
