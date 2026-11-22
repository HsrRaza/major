'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FolderGit2, 
  ArrowLeft, 
  Sparkles
} from 'lucide-react';
import { useRepoStore } from '@/stores/repoStore';
import { Button } from '@/components/ui/Button';
import { FileExplorerTable } from '@/components/dashboard/FileExplorerTable';

export default function RepositoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const repoId = resolvedParams.id;

  const { repositories, setActiveRepoId } = useRepoStore();
  const repo = repositories.find((r) => r.id === repoId) || repositories[0];

  const handleActivateAndOpen = () => {
    setActiveRepoId(repo.id);
    router.push('/dashboard');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fadeIn">
      {/* Header bar */}
      <div className="surface-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/repositories')}
            className="text-[#64748B] hover:text-[#172033]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#172033] flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-[#E5484D]" />
              <span>{repo.owner ? `${repo.owner}/${repo.name}` : repo.name}</span>
            </h2>
            <p className="text-xs text-[#64748B] font-sans mt-0.5">
              {repo.description || 'Workspace configuration and file architecture.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={handleActivateAndOpen}
            className="text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open in Dashboard</span>
          </Button>
        </div>
      </div>

      {/* Files Table */}
      <FileExplorerTable />
    </div>
  );
}
