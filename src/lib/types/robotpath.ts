export interface PathPoint {
  x: number;
  y: number;
}

export type Stroke = PathPoint[];

export type AutoPath = Stroke[];

export interface RobotPathData {
  label: string;
  fieldWidth: number;
  fieldHeight: number;
  strokes: AutoPath;
  createdAt: string;
}
