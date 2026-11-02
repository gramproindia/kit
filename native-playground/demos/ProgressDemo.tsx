import { useEffect, useState } from "react";
import { Text } from "react-native";
import { Button } from "../../source/components/button";
import { CircularProgress, Progress } from "../../source/components/progress";
import { useKitTheme } from "../../source/components/shared/native";
import { Row, Section } from "./layout";

export function ProgressDemo() {
  const { tokens } = useKitTheme();
  const [value, setValue] = useState(35);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setValue((v) => {
        if (v >= 100) {
          setRunning(false);
          return 100;
        }
        return Math.min(100, v + 7);
      });
    }, 300);
    return () => clearInterval(timer);
  }, [running]);

  return (
    <>
      <Section title="Progress · bar">
        <Progress label="Uploading statement.pdf" value={value} showValue />
        <Progress label="Storage" value={3.2} max={8} showValue valueText="3.2 GB of 8 GB" variant="warning" />
        <Progress label="Sync" value={100} showValue variant="success" size="lg" />
        <Progress label="Failed import" value={62} showValue variant="danger" size="sm" />
        <Progress label="Preparing export" value={null} showValue />
        <Progress aria-label="No header" value={value} />
      </Section>

      <Section title="Progress · ring">
        <Row>
          <CircularProgress value={value} showValue />
          <CircularProgress value={12} size={56} thickness={6} showValue variant="danger" />
          <CircularProgress value={50} size={56} thickness={6} showValue variant="warning" />
          <CircularProgress value={88} size={64} thickness={8} showValue variant="success" />
          <CircularProgress value={null} />
          <CircularProgress value={70} size={56}>
            <Text style={{ color: tokens.fg, fontSize: 12, fontWeight: "700" }}>7/10</Text>
          </CircularProgress>
        </Row>
      </Section>

      <Row>
        <Button
          onPress={() => {
            setValue(0);
            setRunning(true);
          }}
        >
          Run upload
        </Button>
        <Button variant="secondary" onPress={() => setValue((v) => Math.max(0, v - 10))}>
          −10
        </Button>
        <Button variant="secondary" onPress={() => setValue((v) => Math.min(100, v + 10))}>
          +10
        </Button>
      </Row>
    </>
  );
}
