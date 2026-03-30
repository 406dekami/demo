/**
 * LLM 请求相关的自定义 Hook
 */

export interface LlmItem {
  id: number;
  name: string;
  logo: string;
  tags: string[];
  rank?: number;
  status?: string;
  Llm?: Array<{
    llm_name: string;
    model_type?: string[];
  }>;
}

// 可以在这里添加其他与LLM请求相关的hook
// 例如：
// export const useSelectLlmList = () => { /* 实现 */ };
// export const useDeleteLlm = () => { /* 实现 */ };
// export const useSaveApiKey = () => { /* 实现 */ };
