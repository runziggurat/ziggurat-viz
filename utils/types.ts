
export interface VizData {
    viz_state: any
    meta_data: { updated_at: number }
}

export const enum StatusCode {
    Loading,
    Error,
    Warning,
    Success,
}

export type Status = {
    code: StatusCode
    message: string
}