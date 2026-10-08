"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Stat,
  trendDirection,
} from "@/components/card";
import { Menu, MenuItem } from "@/components/menu";
import { Empty, Skeleton } from "@/components/skeleton";

const InboxIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 13h4l2 3h4l2-3h4" />
    <path d="M5 5h14l2 8v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4Z" />
  </svg>
);

export default function CardStatsWrapper() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardBody>
            <Stat
              label="Revenue"
              value="£48,120"
              trend={{
                direction: trendDirection(12.4),
                label: "12.4%",
                description: "vs last month",
              }}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat
              label="Churn"
              value="2.1%"
              trend={{
                direction: trendDirection(0.6),
                label: "0.6pp",
                invert: true,
                description: "vs last month",
              }}
            />
          </CardBody>
        </Card>
        <Card variant="elevated">
          <CardBody>
            <Stat
              label="Open tickets"
              value="34"
              loading={loading}
              help="Updated a minute ago"
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={<h3 className="text-sm font-semibold">Recent activity</h3>}
          description="Everything that happened today"
          actions={
            <Menu
              trigger={
                <Button variant="ghost" size="sm">
                  Options
                </Button>
              }
              label="Card options"
            >
              <MenuItem onSelect={() => setLoading((value) => !value)}>
                {loading ? "Stop loading" : "Simulate loading"}
              </MenuItem>
            </Menu>
          }
        />
        <CardBody>
          {loading ? (
            <Skeleton lines={3} label="Loading activity" />
          ) : (
            <Empty
              size="sm"
              icon={<InboxIcon />}
              title="No activity yet"
              description="Once someone uploads a file, it will show up here."
              actions={<Button size="sm">Invite your team</Button>}
            />
          )}
        </CardBody>
        <CardFooter>
          <Button variant="ghost" size="sm">
            View all
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
