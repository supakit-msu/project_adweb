import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JobService } from './job.service';
import { JobSheet } from './job.model';

@Component({
  selector: 'app-rider-page',
  imports: [RouterLink],
  templateUrl: './rider-page.html',
})
export class RiderPage {
  private jobs = inject(JobService);
  private router = inject(Router);

  readonly availableJobs = signal<{ code: string; rider: string; boxes: number; stopsCount: number }[]>([]);
  readonly code = signal('');
  readonly job = signal<JobSheet | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  /** ลำดับจุดที่ส่งแล้ว (เก็บในเครื่องไรเดอร์) */
  readonly done = signal<number[]>([]);

  readonly doneCount = computed(() => this.done().length);
  readonly nextStop = computed(() => this.job()?.stops.find((s) => !this.done().includes(s.sequence)) ?? null);
  readonly progress = computed(() => {
    const j = this.job();
    return j ? Math.round((this.doneCount() / j.stops.length) * 100) : 0;
  });

  constructor() {
    this.refreshAvailableJobs();
    inject(ActivatedRoute).paramMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((p) => {
      const c = p.get('code');
      if (c) { this.code.set(c.toUpperCase()); this.load(c); } else { this.job.set(null); this.refreshAvailableJobs(); }
    });
  }

  refreshAvailableJobs() {
    this.availableJobs.set(this.jobs.getAvailableJobs());
  }

  onInput(e: Event) { this.code.set((e.target as HTMLInputElement).value.toUpperCase()); this.error.set(''); }

  open(code = this.code()) {
    const c = code.trim().toUpperCase();
    if (!c) { this.error.set('กรอกเลขใบงานก่อน'); return; }
    this.router.navigate(['/rider', c]);
  }

  back() {
    this.job.set(null);
    this.code.set('');
    this.refreshAvailableJobs();
    this.router.navigate(['/rider']);
  }

  private async load(code: string) {
    this.loading.set(true);
    this.error.set('');
    const job = await this.jobs.getJob(code);
    this.loading.set(false);
    if (!job) { this.job.set(null); this.error.set(`ไม่พบเลขใบงาน "${code.toUpperCase()}" ตรวจสอบเลขแล้วลองใหม่`); return; }
    this.job.set(job);
    this.done.set(this.readDone(job.job_code));
  }

  toggle(seq: number) {
    const next = this.done().includes(seq) ? this.done().filter((s) => s !== seq) : [...this.done(), seq];
    this.done.set(next);
    const j = this.job();
    if (j) this.saveDone(j.job_code, next);
  }

  private readDone(code: string): number[] {
    try { return JSON.parse(localStorage.getItem('rider-done-' + code) ?? '[]'); } catch { return []; }
  }
  private saveDone(code: string, v: number[]) {
    try { localStorage.setItem('rider-done-' + code, JSON.stringify(v)); } catch { /* ignore */ }
  }
}
