import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JobDetail } from "./JobDetail";
import type { ReelflowJob } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("reelflow_jobs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!data) notFound();

  return <JobDetail initialJob={data as ReelflowJob} />;
}
