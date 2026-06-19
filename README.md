# ReelFlow

SaaS que convierte un **video crudo + una descripción corta** en un **Reel listo para Instagram**: silencios recortados, **subtítulos animados quemados palabra por palabra (español)**, en el formato elegido (9:16 por defecto; también 1:1, 4:5, 16:9). Cualquier usuario se registra, paga y sube sus videos.

## Arquitectura

```
Usuario (signup + Stripe) ─▶ Next.js 14 (Vercel)
   • upload por signed URL ─▶ Supabase Storage (reelflow_uploads)
   • crea fila ───────────▶ Supabase Postgres (reelflow_jobs, RLS por usuario)
                                   │  (cola por POLLING, sin puertos entrantes)
                                   ▼
   Worker Docker en Render (escalable, por polling):
     1) auto-editor  ── corta silencios (--margin 0.2s)            ─▶ tight.mp4
     2) whisper.cpp  ── transcribe ES, timing palabra-por-palabra
     3) IA (opcional) ─ copy del Reel vía API Anthropic (caption/hook/hashtags)
     4) Remotion     ── quema subtítulos animados, aspecto elegido ─▶ final.mp4
                                   ▼
   sube a Supabase Storage (reelflow_outputs) · job=done · el usuario descarga
```

## Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind → Vercel
- **Datos:** Supabase (Auth multi-tenant, Postgres, Storage) — proyecto NUEVO
- **Worker:** Docker (Node + Python) en Render — por polling
- **Edición:** auto-editor (silencios) · whisper.cpp local (subtítulos) · Remotion (render)
- **IA:** API de Anthropic (copy) — per-token, NO suscripción
- **Cobros:** Stripe (global)

## Reglas de aislamiento (inquebrantables)
- Todo vive bajo `~/proyectos/reelflow`. Repo git independiente.
- Prefijo `reelflow_` en tablas, buckets, env y servicios.
- Infra 100% nueva: NO se reutiliza Supabase/Render/Vercel/Redis/DB de AutoEnvía.
- Cero instalaciones globales en el host: Node→`node_modules`, Python→`venv`, y todo lo de sistema (ffmpeg/whisper/chromium) **dentro de Docker**.
- Worker por polling: no abre puertos entrantes.
- En local, el contenedor corre con `cpus`/`mem_limit` para no ahogar la Mac.

## Licencias / ToS (verificado)
- auto-editor: Unlicense/MIT · whisper.cpp: MIT · ffmpeg: LGPLv3 (binario aparte) → uso comercial OK.
- **Remotion:** gratis para uso comercial si sos **individuo o ≤3 empleados** y self-host; **$100/mes** si el equipo llega a 4+.
- **Anthropic:** uso comercial/backend requiere **API key** (no suscripción Pro/Max). La suscripción es solo para uso personal/desarrollo.

## Fases
0. Scaffold aislado ✅
1. Supabase: `reelflow_jobs` + Auth + Storage + RLS
2. Frontend (auth, upload, formatos, dashboard con polling, checkout)
3. Worker Docker (pipeline + claim atómico)
4. Remotion (template TikTok + marca Nocturno, 4 aspectos)
5. IA copy (API Anthropic)
6. Stripe (suscripción + webhooks + límites por plan)
7. Deploy (Vercel + Render) + smoke test end-to-end

## Seguridad y operación
- **Multi-tenant:** RLS por `user_id` en jobs, suscripciones y Storage; `service_role` solo server-side (worker + webhooks).
- **Límites de abuso:** upload máx. 1 GB y MIME restringido (en el bucket), duración máx. 10 min (worker), gating por cuota mensual (sin contar errores).
- **Resiliencia:** reaper de jobs colgados (`reelflow_reap_stale_jobs`, 30 min). Escalado: correr más instancias del worker (claim atómico `FOR UPDATE SKIP LOCKED`).
- **Storage:** el crudo se borra tras procesar; borrar un job borra sus objetos.
- **HTTP/seguridad:** security headers, validación de `next` (anti open-redirect), worker bindeado a `127.0.0.1`, Next 14.2.35 (CVE de middleware corregido).
- **Pendiente (hardening futuro):** rate limiting (Upstash), cuota check+insert atómico, dedupe de webhooks por `event.id`, observabilidad (Sentry), upgrade mayor a Next 15/16.

## Desarrollo (local)
```bash
npm install                 # instala workspaces (local, no global)
npm run dev:web             # Next.js en localhost:3000

# Worker (requiere Docker Desktop encendido):
docker compose up --build reelflow_worker
```
> Secrets en `.env.local` (no se commitea). Ver `.env.example`.
