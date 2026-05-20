export interface DataStreamApi {
  setText(name: string, value: string): Promise<void>;
  addText(name: string, value: string, delimiter: string): Promise<void>;
  setNum(name: string, value: number): Promise<void>;
  stepNum(name: string, step: number): Promise<void>;
  setBool(name: string, value: boolean): Promise<void>;
}
