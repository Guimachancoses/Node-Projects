export const CREATE_AVALIACAO_REQUEST = "@avaliacao/CREATE_AVALIACAO_REQUEST";
export const CREATE_AVALIACAO_SUCCESS = "@avaliacao/CREATE_AVALIACAO_SUCCESS";
export const CREATE_AVALIACAO_FAILURE = "@avaliacao/CREATE_AVALIACAO_FAILURE";
export const RESET_AVALIACAO_STATUS = "@avaliacao/RESET_AVALIACAO_STATUS";

export type RatingOption = "excelente" | "boa" | "regular" | "ruim";

export interface AvaliacaoPayload {
  rating: RatingOption;
  reasons: string[];
  comment: string;
}

export interface Avaliacao {
  _id?: string;
  id?: string;
  rating: RatingOption;
  reasons: string[];
  comment: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvaliacaoState {
  loading: boolean;
  success: boolean;
  error: string | null;
  data: Avaliacao | null;
}

export interface CreateAvaliacaoRequestAction {
  type: typeof CREATE_AVALIACAO_REQUEST;
  payload: AvaliacaoPayload;
}

export interface CreateAvaliacaoSuccessAction {
  type: typeof CREATE_AVALIACAO_SUCCESS;
  payload: Avaliacao;
}

export interface CreateAvaliacaoFailureAction {
  type: typeof CREATE_AVALIACAO_FAILURE;
  payload: string;
}

export interface ResetAvaliacaoStatusAction {
  type: typeof RESET_AVALIACAO_STATUS;
}

export type AvaliacaoAction =
  | CreateAvaliacaoRequestAction
  | CreateAvaliacaoSuccessAction
  | CreateAvaliacaoFailureAction
  | ResetAvaliacaoStatusAction;
