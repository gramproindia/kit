import { Textarea } from "../../source/components/textarea";
import { Section } from "./layout";

export function TextareaDemo() {
  return (
    <Section title="Textarea">
      <Textarea label="Notes" placeholder="Anything we should know?" description="Fixed at 3 rows." />
      <Textarea
        label="Message"
        autoResize
        minRows={2}
        maxRows={6}
        showCount
        maxLength={140}
        placeholder="Grows from 2 to 6 rows, then scrolls"
        required
      />
      <Textarea label="Feedback" defaultValue="Too short" error="Write at least 20 characters." />
      <Textarea label="Read only" readOnly defaultValue={"Line one\nLine two"} rows={2} />
      <Textarea label="Disabled" disabled rows={2} />
    </Section>
  );
}
