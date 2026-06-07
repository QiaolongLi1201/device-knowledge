import type {
  DeviceKnowledgeModuleData,
  CommandPattern,
  DocIndexEntry,
  EndorsedSkillRef,
  FailureHint,
  KnowledgeCompatibilityScope,
  KnowledgeRecordBase,
  PromptFragment,
  WorkflowGuide,
} from './types.js';

export interface AgentKnowledgeContextOptions {
  /**
   * Optional concrete platform id, e.g. `rdk-x5` or `jetson-orin-nano`.
   */
  platform?: string;
  /**
   * Optional family label, e.g. `rdk`. Module selection is handled by callers.
   */
  family?: string;
  /**
   * Limit documentation records in the rendered context. Defaults to 12.
   */
  maxDocs?: number;
  /**
   * Include records marked as draft. Defaults to false.
   */
  includeDrafts?: boolean;
  /**
   * Include records marked as deprecated. Defaults to false.
   */
  includeDeprecated?: boolean;
  /**
   * Restrict prompt/doc sections when provided.
   */
  sections?: string[];
}

export interface AgentKnowledgeContext {
  module: {
    id: string;
    name: string;
    version: string;
    family?: string;
  };
  scope: {
    platform?: string;
    family?: string;
  };
  profiles: Record<string, unknown>;
  docs: DocIndexEntry[];
  promptFragments: PromptFragment[];
  commandPatterns: CommandPattern[];
  failureHints: FailureHint[];
  skills: EndorsedSkillRef[];
  workflowGuides: WorkflowGuide[];
  markdown: string;
}

function lowerSet(values: string[] | undefined): Set<string> {
  return new Set((values ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean));
}

function scopeMatches(scope: KnowledgeCompatibilityScope | undefined, options: AgentKnowledgeContextOptions): boolean {
  const platform = options.platform?.trim().toLowerCase();
  if (!platform || !scope?.platforms?.length) return true;
  return lowerSet(scope.platforms).has(platform);
}

function recordMatches(record: KnowledgeRecordBase, options: AgentKnowledgeContextOptions): boolean {
  if (!options.includeDrafts && record.status === 'draft') return false;
  if (!options.includeDeprecated && record.status === 'deprecated') return false;
  return scopeMatches(record.scope, options);
}

function sectionMatches(record: { section?: string }, sections: Set<string> | undefined): boolean {
  if (!sections || !record.section) return true;
  return sections.has(record.section.trim().toLowerCase());
}

function categoryMatches(record: { category?: string }, sections: Set<string> | undefined): boolean {
  if (!sections || !record.category) return true;
  return sections.has(record.category.trim().toLowerCase());
}

function selectProfiles(
  profiles: Record<string, unknown> | undefined,
  options: AgentKnowledgeContextOptions,
): Record<string, unknown> {
  if (!profiles) return {};
  const platform = options.platform?.trim().toLowerCase();
  if (platform) {
    for (const [id, profile] of Object.entries(profiles)) {
      if (id.trim().toLowerCase() === platform) return { [id]: profile };
    }
    return {};
  }
  return { ...profiles };
}

function sourceLabel(record: KnowledgeRecordBase): string {
  if (record.citationLabel) return record.citationLabel;
  if (record.source.url) return record.source.url;
  if (record.source.repo) return record.source.repo;
  return record.source.type;
}

function renderAgentKnowledgeMarkdown(context: Omit<AgentKnowledgeContext, 'markdown'>): string {
  const lines: string[] = [];
  lines.push(`# ${context.module.name} knowledge`);
  lines.push('');
  lines.push(`- Module: ${context.module.id}@${context.module.version}`);
  if (context.scope.platform) lines.push(`- Platform scope: ${context.scope.platform}`);
  if (context.scope.family) lines.push(`- Family scope: ${context.scope.family}`);

  const profileEntries = Object.entries(context.profiles);
  if (profileEntries.length > 0) {
    lines.push('', '## Device Profiles');
    for (const [id, profile] of profileEntries) {
      const p = profile as Record<string, unknown>;
      const display = typeof p.displayName === 'string' ? p.displayName : id;
      const compute = typeof p.computeTops === 'number' ? `${p.computeTops} TOPS` : undefined;
      const soc = typeof p.soc === 'string' ? p.soc : undefined;
      lines.push(`- ${display}${soc ? ` (${soc})` : ''}${compute ? ` — ${compute}` : ''}`);
    }
  }

  if (context.promptFragments.length > 0) {
    lines.push('', '## Prompt Fragments');
    for (const fragment of context.promptFragments) {
      lines.push(`- [${fragment.section}/${fragment.tier}/${fragment.mode}] ${fragment.content}`);
    }
  }

  if (context.docs.length > 0) {
    lines.push('', '## Source-Backed Docs');
    for (const doc of context.docs) {
      lines.push(`- ${doc.title} — ${doc.url} (${sourceLabel(doc)})`);
    }
  }

  if (context.commandPatterns.length > 0) {
    lines.push('', '## Command Patterns');
    for (const command of context.commandPatterns) {
      lines.push(`- [${command.riskLevel}] ${command.category}: ${command.description}`);
    }
  }

  if (context.failureHints.length > 0) {
    lines.push('', '## Failure Hints');
    for (const hint of context.failureHints) {
      const doc = hint.docUrl ? ` See ${hint.docUrl}` : '';
      lines.push(`- ${hint.suggestion}${doc}`);
    }
  }

  if (context.skills.length > 0) {
    lines.push('', '## Endorsed Skills');
    for (const skill of context.skills) {
      lines.push(`- ${skill.id}${skill.category ? ` (${skill.category})` : ''}`);
    }
  }

  if (context.workflowGuides.length > 0) {
    lines.push('', '## Workflow Guides');
    for (const guide of context.workflowGuides) {
      lines.push('', `### ${guide.title}`);
      lines.push(`- Category: ${guide.category}`);
      lines.push(`- Triggers: ${guide.triggers.join(', ')}`);
      if (guide.prerequisites?.length) {
        lines.push(`- Prerequisites: ${guide.prerequisites.join('; ')}`);
      }
      lines.push('- Steps:');
      guide.steps.forEach((step, index) => {
        const command = step.command ? ` Command: \`${step.command}\`.` : '';
        const expected = step.expected ? ` Expected: ${step.expected}` : '';
        const risk = step.riskLevel ? ` [${step.riskLevel}]` : '';
        lines.push(`  ${index + 1}. ${step.title}${risk}: ${step.detail}${command}${expected}`);
      });
      lines.push('- Verification:');
      for (const check of guide.verification) {
        const command = check.command ? ` Command: \`${check.command}\`.` : '';
        lines.push(`  - ${check.title}:${command} Expected: ${check.expected}`);
      }
      if (guide.safetyNotes?.length) {
        lines.push(`- Safety: ${guide.safetyNotes.join('; ')}`);
      }
      lines.push(`- Expected outcome: ${guide.expectedOutcome}`);
      if (guide.relatedUrls?.length) {
        lines.push(`- Related sources: ${guide.relatedUrls.join(', ')}`);
      }
    }
  }

  return `${lines.join('\n')}\n`;
}

/**
 * Build a runtime-agnostic context pack for LLM agents, MCP servers, CLIs, and
 * host applications. This keeps the reusable view in device-knowledge instead
 * of forcing every runtime to depend on the Moss adapter.
 */
export function buildAgentKnowledgeContext(
  data: DeviceKnowledgeModuleData,
  options: AgentKnowledgeContextOptions = {},
): AgentKnowledgeContext {
  const sections = options.sections?.length ? lowerSet(options.sections) : undefined;
  const maxDocs = Math.max(0, Math.floor(options.maxDocs ?? 12));

  const docs = (data.docs ?? [])
    .filter((record) => recordMatches(record, options))
    .filter((record) => sectionMatches(record, sections))
    .slice(0, maxDocs);
  const promptFragments = (data.promptFragments ?? [])
    .filter((record) => recordMatches(record, options))
    .filter((record) => sectionMatches(record, sections))
    .sort((a, b) => b.priority - a.priority);
  const commandPatterns = (data.commandPatterns ?? []).filter((record) => recordMatches(record, options));
  const failureHints = (data.failureHints ?? []).filter((record) => recordMatches(record, options));
  const skills = (data.skills ?? []).filter((record) => recordMatches(record, options));
  const workflowGuides = (data.workflowGuides ?? [])
    .filter((record) => recordMatches(record, options))
    .filter((record) => categoryMatches(record, sections));

  const contextBase: Omit<AgentKnowledgeContext, 'markdown'> = {
    module: {
      id: data.manifest.id,
      name: data.manifest.name,
      version: data.manifest.version,
      ...(data.manifest.family ? { family: data.manifest.family } : {}),
    },
    scope: {
      ...(options.platform ? { platform: options.platform } : {}),
      ...(options.family ? { family: options.family } : {}),
    },
    profiles: selectProfiles(data.profiles, options),
    docs,
    promptFragments,
    commandPatterns,
    failureHints,
    skills,
    workflowGuides,
  };

  return {
    ...contextBase,
    markdown: renderAgentKnowledgeMarkdown(contextBase),
  };
}
