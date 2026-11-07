<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep Nemo inference in server-only helpers with a shared validated action schema, so model output cannot choose arbitrary writable fields.
- Local-workspace Nemo uses a bounded public inference-only server function with no database access; cloud actions require authenticated owner-scoped functions, because local demo identity is not authorization.
- Preserve the guest-aware bearer middleware in start.ts; the local adapter has no getSession method, while real cloud sessions still require bearer attachment.
