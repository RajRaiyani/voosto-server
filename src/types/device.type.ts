export type Record = {
  imei: string;
  timestamp: Date;
  priority: number;
  event_trigger_id: number;
  gps: {
    latitude: number;
    longitude: number;
    altitude: number;
    angle: number;
    satellites: number;
    speed: number;
  };
  io_elements: {
    [key: string]: number;
  };
};

export type ProcessedRecord = {
  imei: string;
  timestamp: Date;
  priority: number;
  event_trigger_id: number;
  gps: {
    latitude: number;
    longitude: number;
    altitude: number;
    angle: number;
    satellites: number;
    speed: number;
  };
  io_elements: {
    [key: string]: number;
  };
  io_elements_with_validation: {
    [key:string] : {
      is_safe : boolean;
      value : number;
    }
  }
};
