import { profile } from "@/content/profile";
import { Eyebrow, Panel } from "./ui";

export function QuestLog() {
  const active = profile.experience.filter((j) => j.current);
  const completed = profile.experience.filter((j) => !j.current);

  return (
    <Panel id="quests" title="QUEST LOG">
      {active.map((job, i) => (
        <article
          key={job.title}
          className={`flex flex-col gap-2.5 border-[3px] p-5 ${i === 0 ? "border-teal" : "border-line"}`}
        >
          <Eyebrow tone={i === 0 ? "teal" : "muted"}>
            {i === 0 ? "Main quest" : "Active quest"} · {job.period}
          </Eyebrow>
          <h3 className="m-0 text-xl font-bold">{job.title}</h3>
          <p className="m-0 text-[15px] text-muted">
            {job.org}
            {job.orgNote && <> · {job.orgNote}</>}
          </p>
          <ul className="m-0 pl-5 text-[15px] leading-relaxed">
            {job.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </article>
      ))}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
        {completed.map((job) => (
          <article key={job.title} className="flex flex-col gap-1.5 border-[3px] border-line p-4">
            <Eyebrow>Completed · {job.period}</Eyebrow>
            <h3 className="m-0 text-[17px] font-bold">{job.title}</h3>
            <p className="m-0 text-sm text-muted">{job.org}</p>
            <p className="m-0 text-sm">{job.bullets[0]}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}
