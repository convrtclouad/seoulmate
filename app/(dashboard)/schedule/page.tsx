"use client";

import { useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LoadingPlane } from "@/components/ui/LoadingPlane";
import { Timeline } from "@/components/schedule/Timeline";
import { ActivityForm } from "@/components/schedule/ActivityForm";
import { useSchedule, useAddActivity, useDeleteActivity } from "@/lib/hooks/useSchedule";

const TRIP_ID = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";

export default function SchedulePage() {
  const [showForm, setShowForm] = useState(false);

  const { data: activities = [], isLoading } = useSchedule(TRIP_ID);
  const addActivity    = useAddActivity(TRIP_ID);
  const deleteActivity = useDeleteActivity(TRIP_ID);

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <Header
        title="行程"
        right={
          <Button size="sm" onClick={() => setShowForm(true)} icon={<Plus className="h-4 w-4" />}>
            新增
          </Button>
        }
      />

      <div className="px-4 py-4 space-y-4 pb-safe">
        {/* Trip stats */}
        {activities.length > 0 && (
          <div className="card flex items-center gap-3">
            <div className="rounded-2xl bg-forest-mist p-3">
              <CalendarDays className="h-6 w-6 text-forest-mid" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">已规划行程</p>
              <p className="text-xl font-black text-gray-900">{activities.length} 个</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        {isLoading ? (
          <LoadingPlane text="载入行程中..." />
        ) : (
          <Timeline
            activities={activities}
            onDelete={(id) => deleteActivity.mutate(id)}
          />
        )}
      </div>

      {/* Add Activity Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="新增行程" size="full">
        <ActivityForm
          onSubmit={async (form) => {
            await addActivity.mutateAsync(form);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
