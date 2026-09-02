'use client';

/// <reference types="webmcp-types" />

import { useEffect, useState } from 'react';
import { useStore } from 'zustand';

import { evaluateCompatibility } from '../domain/compatibility';
import { buildStore } from '../store/build-store';
import { baseToolNames, createResolveBuildIssuesTool, createWebMcpTools } from './tools';

type RegistrationState = {
  available: boolean;
  registered: string[];
  failed: string[];
};

export function useWebMcpRegistration(): RegistrationState {
  const hasCompatibilityError = useStore(buildStore, (state) =>
    evaluateCompatibility(state.selected).status === 'error',
  );
  const [state, setState] = useState<RegistrationState>({
    available: false,
    registered: [],
    failed: [],
  });

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tools = createWebMcpTools(buildStore);
    const debugWindow = window as typeof window & {
      __partNerWebMcpTools?: WebMCP.ModelContextTool[];
    };
    if (new URLSearchParams(window.location.search).get('debug') === '1') {
      debugWindow.__partNerWebMcpTools = tools;
    }
    for (const tool of tools) {
      void context.registerTool(tool, { signal: lifecycle.signal }).then(
        () => setState((current) => ({
          ...current,
          available: true,
          registered: current.registered.includes(tool.name)
            ? current.registered
            : [...current.registered, tool.name],
        })),
        () => {
          if (!lifecycle.signal.aborted) {
            setState((current) => ({ ...current, failed: [...current.failed, tool.name] }));
          }
        },
      );
    }

    return () => {
      lifecycle.abort();
      delete debugWindow.__partNerWebMcpTools;
    };
  }, []);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool || !hasCompatibilityError) return;
    const lifecycle = new AbortController();
    const tool = createResolveBuildIssuesTool(buildStore);
    const debugWindow = window as typeof window & {
      __partNerWebMcpTools?: WebMCP.ModelContextTool[];
    };
    if (new URLSearchParams(window.location.search).get('debug') === '1') {
      debugWindow.__partNerWebMcpTools = [
        ...(debugWindow.__partNerWebMcpTools ?? []),
        tool,
      ];
    }
    void context.registerTool(tool, { signal: lifecycle.signal }).then(
      () => setState((current) => ({
        ...current,
        available: true,
        registered: current.registered.includes(tool.name)
          ? current.registered
          : [...current.registered, tool.name],
      })),
      () => {
        if (!lifecycle.signal.aborted) {
          setState((current) => ({ ...current, failed: [...current.failed, tool.name] }));
        }
      },
    );
    return () => {
      lifecycle.abort();
      if (debugWindow.__partNerWebMcpTools) {
        debugWindow.__partNerWebMcpTools = debugWindow.__partNerWebMcpTools.filter(
          (item) => item.name !== tool.name,
        );
      }
      setState((current) => ({
        ...current,
        registered: current.registered.filter((name) => name !== 'resolve_build_issues'),
      }));
    };
  }, [hasCompatibilityError]);

  return state;
}

export { baseToolNames };
