export interface SheetData {
  headers: string[];
  rows: string[][];
}

export interface MappedField {
  id: string;
  sheetColumn: string;
  position: {
    x: number;
    y: number;
  };
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
  };
}

export interface CertificateConfig {
  template: string;
  mappedFields: MappedField[];
}
