import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Save, X } from 'lucide-react';

/**
 * Componente template para formulários padronizados
 * 
 * Props:
 * - open: boolean - se o modal está aberto
 * - onClose: function - callback ao fechar
 * - title: string - título do formulário
 * - isEditing: boolean - se está editando ou criando
 * - isSaving: boolean - se está salvando
 * - isValid: boolean - se o formulário é válido
 * - onSave: function - callback ao salvar
 * - tabs: array - array com {id, label, content}
 * - headerGradient: string - gradiente do header (padrão: blue)
 * - accentColor: string - cor de destaque (padrão: #84cc16)
 */
export default function FormTemplate({
  open,
  onClose,
  title,
  isEditing = false,
  isSaving = false,
  isValid = true,
  onSave,
  tabs = [],
  children,
  headerGradient = 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
  accentColor = '#84cc16',
  mandatoryFieldsText = '* Campos obrigatórios'
}) {
  const hasTabs = tabs && tabs.length > 0;
  const defaultTab = tabs?.[0]?.id || null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b" style={{ background: headerGradient }}>
          <DialogTitle className="text-xl font-semibold text-white">
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="p-8 bg-slate-50/30 dark:bg-slate-900/30">
            {hasTabs ? (
              <Tabs defaultValue={defaultTab} className="w-full">
                {/* Tabs List */}
                <TabsList className="mb-8 bg-transparent border-b border-slate-200 dark:border-slate-700 rounded-none h-auto p-0 space-x-8">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3"
                      style={{
                        borderBottomColor: 'transparent',
                      }}
                      data-accent={accentColor}
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Tabs Content */}
                {tabs.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="space-y-8">
                    {tab.content}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              children
            )}
          </div>

          <style>{`
            [data-accent="${accentColor}"] {
              --accent-color: ${accentColor};
            }
            [data-state="active"][data-accent] {
              border-bottom-color: ${accentColor};
            }
          `}</style>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <div className="px-8 py-6 flex items-center justify-between gap-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium flex-shrink-0">
              {mandatoryFieldsText}
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-lg px-6 py-2 font-medium border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </Button>
              <Button
                onClick={onSave}
                disabled={!isValid || isSaving}
                className="rounded-lg px-6 py-2 font-medium shadow-lg hover:shadow-xl transition-all"
                style={{
                  background: (!isValid || isSaving) ? '#cbd5e1' : headerGradient,
                  color: 'white'
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? 'Salvar Alterações' : 'Criar'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}