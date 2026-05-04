"use client";

import { useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Timeline } from "@/components/schedule/Timeline";
import { ActivityForm } from "@/components/schedule/ActivityForm";
import { NotificationManager } from "@/components/schedule/NotificationManager";
import { useSchedule, useAddActivity, useDeleteActivity } from "@/lib/hooks/useSchedule";

const TRIP_ID = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";

export default function SchedulePage() {
  const [showForm, setShowForm] = useState(false);

  const { data: activities = [], isLoading } = useSchedule(TRIP_ID);
  const addActivity    = useAddActivity(TRIP_ID);
  const deleteActivity = useDeleteActivity(TRIP_ID);

  return (
    <div className="flex flex-col min-h-dvh">
      <Header
        title="Schedule"
        right={
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Add
          </Button>
        }
      />

      <div className="px-4 py-4 space-y-4 pb-safe">
        {/* Push notification CTA */}
        <NotificationManager activities={activities} />

        {/* Trip progress */}
        {activities.length > 0 && (
          <div className="card flex items-center gap-3">
            <div className="rounded-2xl bg-primary-50 p-3">
              <CalendarDays className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Planned activities</p>
              <p className="text-xl font-black text-gray-900">{activities.length}</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 card h-24 bg-gray-50 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <Timeline
            activities={activities}
            onDelete={(id) => deleteActivity.mutate(id)}
          />
        )}
      </div>

      {/* Add Activity Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New Activity"
        size="full"
      >
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
