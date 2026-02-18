import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, Users, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();

  // Fetch projects and meetings from database
  const { data: projects = [], isLoading: projectsLoading } = trpc.projects.list.useQuery();
  const { data: meetings = [], isLoading: meetingsLoading } = trpc.meetings.list.useQuery();

  if (authLoading || projectsLoading || meetingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const totalTasks = meetings.length;
  const activeProjects = projects.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Project Manager
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Manage your projects, meetings, and tasks efficiently
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Projects in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meetings</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Scheduled meetings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collaborators</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Team members
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Active Projects
          </h2>
          {projects.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-500">
                No projects found. Create one to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription>{project.code}</CardDescription>
                      </div>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <p>
                        {project.dateFrom} to {project.dateTo || "Ongoing"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Meetings Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Recent Meetings
          </h2>
          {meetings.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-500">
                No meetings scheduled yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {meetings.slice(0, 5).map((meeting) => {
                const project = projects.find((p) => p.id === meeting.projectId);
                return (
                  <Card
                    key={meeting.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/meeting/${meeting.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{meeting.title}</CardTitle>
                          <CardDescription>
                            {project?.name} • {meeting.date}
                          </CardDescription>
                        </div>
                        {project && (
                          <div
                            className="w-2 h-8 rounded"
                            style={{ backgroundColor: project.color }}
                          />
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
