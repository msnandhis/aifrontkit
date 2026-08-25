import {
  createContext,
  useContext,
  type CSSProperties,
  type HTMLAttributes,
  type PropsWithChildren
} from "react";
import {
  createTheme,
  getThemeAttributes,
  toCssVariables,
  type ResolvedTheme,
  type ThemeConfig
} from "@aifrontkit/tokens";

export type ThemeInput = ThemeConfig | ResolvedTheme;

const ThemeContext = createContext<ResolvedTheme | null>(null);

function isResolvedTheme(theme: ThemeInput): theme is ResolvedTheme {
  return "schemaVersion" in theme && "tokens" in theme && "motion" in theme;
}

export type ThemeProviderProps = PropsWithChildren<
  Omit<HTMLAttributes<HTMLDivElement>, "color"> & {
    /** A partial configuration or a pre-resolved serialisable theme. */
    theme?: ThemeInput;
  }
>;

/**
 * Applies semantic AIFrontKit variables to one DOM subtree.
 * The host application remains free to override any variable in its own CSS.
 */
export function ThemeProvider({ theme = {}, children, style, ...props }: ThemeProviderProps) {
  const resolved = isResolvedTheme(theme) ? theme : createTheme(theme);
  const variables = toCssVariables(resolved) as CSSProperties;

  return (
    <ThemeContext.Provider value={resolved}>
      <div {...props} {...getThemeAttributes(resolved)} data-aifk-root="" style={{ ...variables, ...style }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/** Read the resolved theme when rendered beneath ThemeProvider. */
export function useAIFrontKitTheme(): ResolvedTheme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useAIFrontKitTheme requires a <ThemeProvider> or a themed <AIFrontKitProvider>.");
  return theme;
}
