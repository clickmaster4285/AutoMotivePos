import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchJobCards,
  fetchJobCardById,
  fetchJobCardRecords,
  createJobCard,
  updateJobCard,
  updateJobCardStatus,
  deleteJobCard,
  type CreateJobCardBody,
  type UpdateJobCardBody,
} from "@/api/jobCard";
import { queryKeys } from "@/api/query-keys";
import type { JobStatus } from "@/types";

export function useJobCardsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.jobCards.list(),
    queryFn: fetchJobCards,
    enabled: options?.enabled ?? true,
  });
}

export function useJobCardQuery(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.jobCards.detail(id ?? ""),
    queryFn: () => fetchJobCardById(id!),
    enabled: (options?.enabled ?? true) && !!id,
  });
}

export function useJobCardRecordsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.jobCards.records(),
    queryFn: fetchJobCardRecords,
    enabled: options?.enabled ?? true,
  });
}

function invalidateJobCardLists(qc: ReturnType<typeof useQueryClient>) {
  return qc.invalidateQueries({ queryKey: queryKeys.jobCards.all });
}

export function useCreateJobCardMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateJobCardBody) => createJobCard(body),
    onSuccess: () => {
      void invalidateJobCardLists(qc);
    },
  });
}

export function useUpdateJobCardMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateJobCardBody }) => updateJobCard(id, body),
    onSuccess: (_data, { id }) => {
      void invalidateJobCardLists(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.jobCards.detail(id) });
    },
  });
}

export function useUpdateJobCardStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobStatus }) => updateJobCardStatus(id, status),
    onSuccess: (_data, { id }) => {
      void invalidateJobCardLists(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.jobCards.detail(id) });
    },
  });
}

export function useDeleteJobCardMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJobCard(id),
    onSuccess: () => {
      void invalidateJobCardLists(qc);
    },
  });
}

