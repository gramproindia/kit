import { useState } from "react";
import { Badge, Tag } from "../../source/components/badge";
import { Button } from "../../source/components/button";
import { Row, Section } from "./layout";

const VARIANTS = ["neutral", "accent", "success", "warning", "danger", "info"] as const;

export function BadgeDemo() {
  const [tags, setTags] = useState(["Kochi", "Berlin", "Austin"]);
  return (
    <>
      {(["soft", "solid", "outline"] as const).map((appearance) => (
        <Section key={appearance} title={`Badge · ${appearance}`}>
          <Row>
            {VARIANTS.map((variant) => (
              <Badge key={variant} variant={variant} appearance={appearance}>
                {variant}
              </Badge>
            ))}
          </Row>
        </Section>
      ))}

      <Section title="Badge · size, dot, count">
        <Row>
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
          <Badge variant="success" dot>
            Online
          </Badge>
          <Badge variant="danger" appearance="solid" count={7} />
          <Badge variant="accent" appearance="solid" count={1234} />
          <Badge count={0} showZero />
          <Badge count={0} />
        </Row>
      </Section>

      <Section title="Tag · removable">
        <Row>
          {tags.map((tag) => (
            <Tag key={tag} variant="accent" onRemove={() => setTags((list) => list.filter((t) => t !== tag))}>
              {tag}
            </Tag>
          ))}
          <Tag disabled onRemove={() => {}}>
            Locked
          </Tag>
          <Tag size="sm">Plain</Tag>
        </Row>
        {tags.length < 3 && (
          <Button size="sm" variant="outline" onPress={() => setTags(["Kochi", "Berlin", "Austin"])}>
            Reset tags
          </Button>
        )}
      </Section>
    </>
  );
}
