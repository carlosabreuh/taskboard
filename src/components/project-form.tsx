"use client";

import { useState } from "react";
import { PROJECT_COLORS, type Project } from "@/lib/types";

export function ProjectFields({ project }: { project?: Project }) {
  const [color, setColor] = useState(project?.color ?? PROJECT_COLORS[0]);

  return (
    <>
      <div>
        <label className="label" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={project?.name ?? ""}
          required
          autoFocus={!project}
          placeholder="e.g. Kitchen remodel"
          className="input text-base"
        />
      </div>
      <div>
        <label className="label" htmlFor="description">
          Description <span className="text-ink-3">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={project?.description ?? ""}
          rows={3}
          placeholder="What's this project about?"
          className="input"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="due_date">
            Target date <span className="text-ink-3">(optional)</span>
          </label>
          <input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={project?.due_date ?? ""}
            className="input"
          />
        </div>
        {project && (
          <div>
            <label className="label" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={project.status}
              className="input"
            >
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
              <option value="done">Done</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        )}
      </div>
      <div>
        <span className="label">Color</span>
        <input type="hidden" name="color" value={color} />
        <div className="flex flex-wrap gap-2">
          {PROJECT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              className={`h-7 w-7 rounded-full transition-transform ${
                color === c
                  ? "scale-110 ring-2 ring-ink ring-offset-2 ring-offset-bg"
                  : "hover:scale-105"
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
