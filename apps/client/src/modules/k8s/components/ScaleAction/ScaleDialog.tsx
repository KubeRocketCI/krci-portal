import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { Minus, Plus, TriangleAlert } from "lucide-react";
import z from "zod";
import { useAppForm } from "@/core/components/form";
import { extractErrorMessage } from "@/core/components/form/utils/extractErrorMessage";
import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Slider } from "@/core/components/ui/slider";
import { useK8sScale } from "@/modules/k8s/hooks/useK8sScale";
import { useHpaForTarget } from "@/modules/k8s/hooks/useHpaForTarget";
import type { ScaleDialogProps } from "./types";

// Soft cap for the manual replica input when no HPA bounds are available.
// Used purely as a UI guardrail to keep the slider/input scale finite; the K8s
// API and server-side Zod schema enforce the real limits.
const MAX_REPLICAS_WITHOUT_HPA = 10_000;

export function ScaleDialog({ props: { item, config }, state: { open, closeDialog } }: ScaleDialogProps) {
  const current = item.spec?.replicas ?? 0;
  const ready = item.status?.readyReplicas ?? 0;
  const unavailable = Math.max(0, current - (item.status?.availableReplicas ?? 0));
  const scale = useK8sScale(config);

  const namespace = item.metadata?.namespace ?? "";
  const name = item.metadata?.name ?? "";

  const { hpa } = useHpaForTarget({
    namespace,
    kind: config.kind,
    apiVersion: config.apiVersion,
    name,
  });

  // If an HPA owns this workload, cap the slider/input at its maxReplicas (and floor at minReplicas).
  // Otherwise use a heuristic: 4× current, with a minimum of 20.
  const hpaMin = hpa?.spec?.minReplicas;
  const hpaMax = hpa?.spec?.maxReplicas;
  const hpaPinned = hpaMin !== undefined && hpaMax !== undefined && hpaMin === hpaMax;
  const heuristicMax = Math.max(current * 4, 20);
  const inputMin = hpaMin ?? 0;
  // When an HPA is present but maxReplicas is missing (malformed manifest), the HPA-managed
  // banner promises strict bounds. Falling back to 10000 would let the user type a value that
  // contradicts the banner. Use the heuristic instead so the cap stays sensible, and warn so
  // the malformed HPA is observable to developers.
  // The warn is moved into a useEffect so it fires only when the condition transitions to true,
  // not on every render or every HPA watch tick.
  const inputMax = hpaMax ?? (hpa ? heuristicMax : MAX_REPLICAS_WITHOUT_HPA);
  const sliderMax = hpaMax ?? heuristicMax;

  // Warn (dev-only) when an HPA is present but has no maxReplicas. Using useEffect
  // ensures the warn fires only when the condition transitions to true — not on every
  // render in React Strict Mode or on every HPA watch tick.
  useEffect(() => {
    if (hpa && hpaMax === undefined) {
      console.warn(`HPA ${hpa.metadata?.name ?? "<unnamed>"} for ${config.kind}/${name} has no spec.maxReplicas`);
    }
  }, [hpa?.metadata?.name, hpaMax, config.kind, name]); // eslint-disable-line react-hooks/exhaustive-deps

  const scaleSchema = useMemo(
    () =>
      z.object({
        replicas: z
          .number()
          .int("Replicas must be a whole number")
          .min(inputMin, `Minimum replicas: ${inputMin}`)
          .max(inputMax, `Maximum replicas: ${inputMax}`),
      }),
    [inputMin, inputMax]
  );

  const form = useAppForm({
    defaultValues: { replicas: current },
    validators: {
      onChange: scaleSchema,
    },
    onSubmit: async ({ value }) => {
      closeDialog();
      scale.mutate({ namespace, name, replicas: value.replicas });
    },
  });

  // Reset form to the workload's current replicas only on the open→true transition.
  // `current` stays in the deps so the next open reads the latest watch value, but the
  // `wasOpen` ref blocks the reset while the dialog is already open — otherwise a live
  // watch update (another actor scaled the workload) would silently overwrite whatever
  // value the user has typed.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      form.reset({ replicas: current });
    }
    wasOpen.current = open;
  }, [open, current]); // eslint-disable-line react-hooks/exhaustive-deps

  // Once the HPA FIRST loads, snap value into the HPA's [min,max] window so the input
  // doesn't display a value below its own min/max. Subsequent watch updates to the HPA
  // (an admin editing bounds while the dialog is open) must NOT overwrite what the user
  // is currently typing — that would silently corrupt user intent.
  // hasClampedRef tracks whether the initial clamp has already run for this dialog open;
  // it is reset to false whenever the dialog transitions from closed → open (same moment
  // wasOpen flips false→true), so re-opening the dialog triggers a fresh clamp.
  const hasClampedRef = useRef(false);
  useEffect(() => {
    if (!open) {
      // Reset so the next open performs the initial clamp again.
      hasClampedRef.current = false;
      return;
    }
    if (!hpa || hasClampedRef.current) return;
    hasClampedRef.current = true;
    const existing = form.getFieldValue("replicas");
    const clamped = Math.max(inputMin, Math.min(inputMax, existing));
    if (clamped !== existing) {
      form.setFieldValue("replicas", clamped);
    }
  }, [open, hpa, inputMin, inputMax]); // eslint-disable-line react-hooks/exhaustive-deps

  const desired = useStore(form.store, (state) => state.values.replicas);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const isDirty = useStore(form.store, (state) => state.isDirty);

  // Local string buffer that decouples the displayed text from the form's numeric value.
  // This lets the user clear the field and type a new number without the controlled input
  // snapping back to the previous value on every key press.
  const [localStr, setLocalStr] = useState(() => String(current));

  // Keep localStr in sync when the form value changes via +/- buttons, slider,
  // HPA clamp, or onBlur restore — but only when the user is not mid-edit
  // (i.e. when the parsed representation of localStr already differs from desired).
  useEffect(() => {
    if (Number(localStr) !== desired) {
      setLocalStr(String(desired));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desired]);

  const ratio = current > 0 ? desired / current : 0;
  const showGuardrail = desired >= 100 || (current > 0 && ratio > 4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // When the HPA pins min===max the Scale button is hidden, so keyboard Enter must
    // also be a no-op — otherwise form submission still fires via the native submit event.
    if (hpaPinned) return;
    void form.handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Scale {config.kind} {name}
          </DialogTitle>
          <DialogDescription>
            Adjust the desired replica count for this workload. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <div className="flex flex-col gap-4">
              <p className="text-muted-foreground text-sm">
                Current: <strong>{current}</strong> desired, <strong>{ready}</strong> ready,{" "}
                <strong>{unavailable}</strong> unavailable
              </p>

              {hpa && (
                <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {hpaPinned ? (
                      <>
                        HPA <strong>{hpa.metadata?.name}</strong> pins replicas to <strong>{hpaMin}</strong>. Use HPA
                        controls to change the replica count.
                      </>
                    ) : (
                      <>
                        This {config.kind} is managed by HorizontalPodAutoscaler <strong>{hpa.metadata?.name}</strong>.
                        Manual replica changes will be overridden on the next reconciliation.
                      </>
                    )}
                  </span>
                </div>
              )}

              <form.AppField name="replicas">
                {(field) => {
                  const value = field.state.value;
                  return (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="scale-desired">Desired replicas</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => field.handleChange(Math.max(inputMin, value - 1))}
                          aria-label="Decrease"
                        >
                          <Minus size={14} />
                        </Button>
                        <Input
                          id="scale-desired"
                          type="number"
                          min={inputMin}
                          max={inputMax}
                          step={1}
                          value={localStr}
                          onChange={(e) => {
                            // Always update the local string buffer so the field doesn't snap back
                            // when the user clears it to retype.
                            setLocalStr(e.target.value);
                            if (e.target.value === "") {
                              // Do not write anything to the form — wait for the user to finish typing.
                              return;
                            }
                            const raw = Number(e.target.value);
                            if (Number.isFinite(raw)) {
                              // Floor — Zod's .int() would catch a decimal at validation time, but
                              // the form store would still hold the float, so the Slider visualizes
                              // a fractional position and the Submit guard (desired === current)
                              // can be defeated by an integer current vs a 3.7 desired.
                              const intVal = Math.floor(raw);
                              field.handleChange(Math.max(inputMin, Math.min(inputMax, intVal)));
                            }
                          }}
                          onBlur={(e) => {
                            // If the user leaves the field empty, restore the display from the
                            // current form value so the input is never left blank after blur.
                            if (e.target.value === "") {
                              setLocalStr(String(value));
                            }
                            field.handleBlur();
                          }}
                          className="w-24 text-center"
                          // Only describe the input by the HPA bounds line when that line is
                          // actually rendered (see condition on the <p id="scale-hpa-bounds"/>
                          // below). Without this guard the attribute points to a non-existent
                          // id when no HPA is present, breaking the AT contract silently.
                          aria-describedby={
                            hpa && (hpaMin !== undefined || hpaMax !== undefined) ? "scale-hpa-bounds" : undefined
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => field.handleChange(Math.min(inputMax, value + 1))}
                          aria-label="Increase"
                        >
                          <Plus size={14} />
                        </Button>
                      </div>
                      <Slider
                        value={[Math.min(value, sliderMax)]}
                        onValueChange={(v) => field.handleChange(v[0])}
                        min={inputMin}
                        max={sliderMax}
                        step={1}
                        aria-label="Desired replicas"
                      />
                      {hpa && (hpaMin !== undefined || hpaMax !== undefined) && (
                        <p id="scale-hpa-bounds" className="text-muted-foreground text-xs">
                          HPA bounds: min <strong>{hpaMin ?? "—"}</strong>, max <strong>{hpaMax ?? "—"}</strong>
                        </p>
                      )}
                      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                        <p role="alert" className="text-destructive text-xs">
                          {extractErrorMessage(field.state.meta.errors)}
                        </p>
                      )}
                    </div>
                  );
                }}
              </form.AppField>

              {showGuardrail && (
                <div className="flex items-center gap-2 rounded-md border border-orange-500/40 bg-orange-50 p-2 text-xs text-orange-900 dark:bg-orange-950/40 dark:text-orange-100">
                  <TriangleAlert size={14} />
                  {current > 0
                    ? `Scaling up by ${ratio.toFixed(1)}× — verify cluster capacity`
                    : `Scaling to ${desired} replicas — verify cluster capacity`}
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => closeDialog()}>
              Cancel
            </Button>
            {!hpaPinned && (
              <Button
                type="submit"
                disabled={!isDirty || isSubmitting || scale.isPending}
                aria-busy={isSubmitting || scale.isPending}
              >
                Scale
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
