import { Text } from "react-native";
import { Avatar, AvatarGroup } from "../../source/components/avatar";
import { Row, Section } from "./layout";

const PEOPLE = ["Anand Remanan", "Ada Lovelace", "Grace Hopper", "അനന്തു രമണൻ", "Linus Torvalds", "Margaret Hamilton"];

export function AvatarDemo() {
  return (
    <>
      <Section title="Avatar · sizes and shapes">
        <Row>
          {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
            <Avatar key={size} size={size} name="Anand Remanan" />
          ))}
        </Row>
        <Row>
          {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
            <Avatar key={size} size={size} shape="square" name="Grace Hopper" />
          ))}
        </Row>
      </Section>

      <Section title="Avatar · names, image, status">
        <Row>
          {PEOPLE.map((name) => (
            <Avatar key={name} size="lg" name={name} />
          ))}
          <Avatar size="lg" name="👨‍👩‍👧 Family" />
        </Row>
        <Row>
          <Avatar size="lg" name="Picsum" src="https://picsum.photos/id/64/120" status="online" />
          <Avatar size="lg" name="Broken Image" src="https://invalid.example/nope.png" status="away" />
          <Avatar size="lg" name="Busy Bee" status="busy" />
          <Avatar size="lg" shape="square" name="Off Line" status="offline" />
          <Avatar size="lg" name="Icon">
            <Text style={{ fontSize: 18 }}>★</Text>
          </Avatar>
        </Row>
      </Section>

      <Section title="AvatarGroup">
        <AvatarGroup label="Assigned to" max={4}>
          {PEOPLE.map((name) => (
            <Avatar key={name} name={name} />
          ))}
        </AvatarGroup>
        <AvatarGroup label="Reviewers" size="lg" shape="square" max={3}>
          {PEOPLE.slice(0, 5).map((name) => (
            <Avatar key={name} name={name} />
          ))}
        </AvatarGroup>
        <AvatarGroup label="Two people" size="sm">
          <Avatar name="Ada Lovelace" />
          <Avatar name="Grace Hopper" />
        </AvatarGroup>
      </Section>
    </>
  );
}
