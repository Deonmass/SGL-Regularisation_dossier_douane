import {
  ChevronDown,
  Users,
  LayoutDashboard,
  LogOut,
  Lock,
  FileCheck,
  Settings,
  Map,
  MapPin,
  Building2,
  Plus,
  Truck,
  FileText
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import bcryptjs from 'bcryptjs';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { usePermission } from '../hooks/usePermission';

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

function Sidebar({ activeMenu, onMenuChange }: SidebarProps) {
  const { agent, signOut } = useAuth();
  const { canView } = usePermission();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'DASHBOARD',
      icon: LayoutDashboard,
    },
    {
      id: 'regularisation',
      label: 'REGULARISATION',
      icon: FileCheck,
      subItems: [
        { id: 'regularisation-nouveau', label: 'Nouveau dossier', icon: Plus },
        { id: 'regularisation-ouest', label: 'OUEST', icon: MapPin },
        { id: 'regularisation-est', label: 'EST', icon: MapPin },
        { id: 'regularisation-sud', label: 'SUD', icon: MapPin },
      ],
    },
    {
      id: 'parametres',
      label: 'PARAMETTRES',
      icon: Settings,
      subItems: [
        { id: 'parametres-regions', label: 'Régions', icon: Map },
        { id: 'parametres-point-entree', label: "Point d'entrée", icon: MapPin },
        { id: 'parametres-bureau-douane', label: 'Bureau douane', icon: Building2 },
        { id: 'parametres-mode-transport', label: 'Mode de transport', icon: Truck },
        { id: 'parametres-regime-importation', label: 'Régime d\'importation', icon: FileText },
        { id: 'parametres-client', label: 'Client', icon: Users },
      ],
    },
    {
      id: 'users',
      label: 'UTILISATEURS',
      icon: Users,
    },
  ];

  const handleMenuClick = (id: string) => {
    onMenuChange(id);
  };

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => {
      if (prev.includes(id)) {
        return prev.filter(menuId => menuId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const isSubMenuActive = (subMenuId: string) => {
    return activeMenu === subMenuId;
  };

  const isExpanded = (id: string) => {
    return expandedMenus.includes(id);
  };

  useEffect(() => {
    if (activeMenu.startsWith('regularisation')) {
      setExpandedMenus(prev => (prev.includes('regularisation') ? prev : [...prev, 'regularisation']));
    }

    if (activeMenu.startsWith('parametres')) {
      setExpandedMenus(prev => (prev.includes('parametres') ? prev : [...prev, 'parametres']));
    }
  }, [activeMenu]);

  const canShowItem = (itemId: string) => {
    if (itemId === 'dashboard') return canView('dashboard');
    if (itemId === 'regularisation') {
      return canView('regularisation') || canView('regularisation-ouest') || canView('regularisation-est') || canView('regularisation-sud');
    }
    if (itemId === 'parametres') {
      return canView('parametres-regions') || canView('parametres-point-entree') || canView('parametres-bureau-douane') || canView('parametres-mode-transport') || canView('parametres-regime-importation') || canView('parametres-client');
    }
    if (itemId === 'users') return canView('users');
    return true;
  };

  const canShowSubItem = (subItemId: string) => canView(subItemId);

  const handleChangePassword = async () => {
    if (!agent?.id) {
      Swal.fire('Erreur', 'Veuillez vous reconnecter', 'error');
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: 'Changer de mot de passe',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Mot de passe actuel</label>
            <div class="relative">
              <input 
                type="password" 
                id="currentPassword" 
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10" 
                placeholder="Entrez votre mot de passe actuel"
              />
              <button 
                type="button"
                id="toggleCurrentPassword"
                class="absolute right-3 top-2.5 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Nouveau mot de passe</label>
            <div class="flex items-center gap-2">
              <div class="relative flex-1">
                <input 
                  type="password" 
                  id="newPassword" 
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10" 
                  placeholder="Entrez votre nouveau mot de passe"
                />
              </div>
              <div id="strengthIcon" class="w-6 h-6 flex items-center justify-center relative group cursor-help" title="Critères de force du mot de passe">
                <svg id="strengthSvg" class="w-5 h-5 transition-all duration-300 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path id="strengthPath" d="" class="transition-all duration-300"/>
                </svg>
                <div class="absolute right-0 mt-2 bg-slate-800 text-white text-xs rounded p-2 w-48 hidden group-hover:block z-50 whitespace-normal bottom-full mb-2">
                  <div class="space-y-1">
                    <div><span id="req-length" class="text-gray-400">○</span> 6 caractères minimum</div>
                    <div><span id="req-lower" class="text-gray-400">○</span> Une lettre minuscule</div>
                    <div><span id="req-upper" class="text-gray-400">○</span> Une lettre majuscule</div>
                    <div><span id="req-number" class="text-gray-400">○</span> Un chiffre</div>
                    <div><span id="req-special" class="text-gray-400">○</span> Un caractère spécial (!@#$%^&*)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Confirmer le mot de passe</label>
            <div class="flex items-center gap-2">
              <div class="relative flex-1">
                <input 
                  type="password" 
                  id="confirmPassword" 
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10" 
                  placeholder="Confirmez votre nouveau mot de passe"
                />
                <button 
                  type="button"
                  id="toggleConfirmPassword"
                  class="absolute right-3 top-2.5 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </button>
              </div>
              <div id="matchIcon" class="w-6 h-6 flex items-center justify-center"></div>
            </div>
            <div id="matchMessage" class="text-xs mt-1 text-red-600 hidden"></div>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Mettre à jour',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626',
      didOpen: () => {
        const currentPasswordInput = document.getElementById('currentPassword') as HTMLInputElement;
        const newPasswordInput = document.getElementById('newPassword') as HTMLInputElement;
        const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;
        
        // Toggle password visibility
        const setupToggle = (toggleId: string, inputId: string) => {
          const toggleBtn = document.getElementById(toggleId);
          const input = document.getElementById(inputId) as HTMLInputElement;
          
          if (toggleBtn && input) {
            toggleBtn.addEventListener('click', (e) => {
              e.preventDefault();
              input.type = input.type === 'password' ? 'text' : 'password';
            });
          }
        };
        
        setupToggle('toggleCurrentPassword', 'currentPassword');
        setupToggle('toggleConfirmPassword', 'confirmPassword');
        
        // Password strength and match check
        const updatePasswordValidation = () => {
          if (!newPasswordInput || !confirmPasswordInput) return;
          
          const newPass = newPasswordInput.value;
          const confirmPass = confirmPasswordInput.value;
          const matchIcon = document.getElementById('matchIcon');
          const matchMessage = document.getElementById('matchMessage');
          const strengthIcon = document.getElementById('strengthIcon');
          
          // Critères de validation
          const hasLength = newPass.length >= 6;
          const hasLower = /[a-z]/.test(newPass);
          const hasUpper = /[A-Z]/.test(newPass);
          const hasNumber = /[0-9]/.test(newPass);
          const hasSpecial = /[!@#$%^&*]/.test(newPass);
          
          const criteriaCount = [hasLength, hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
          
          // Update requirement icons in tooltip
          const updateReqIcon = (id: string, met: boolean) => {
            const elem = document.getElementById(id);
            if (elem) {
              elem.textContent = met ? '✓' : '○';
              elem.className = met ? 'text-green-400 font-bold' : 'text-gray-400';
            }
          };
          
          updateReqIcon('req-length', hasLength);
          updateReqIcon('req-lower', hasLower);
          updateReqIcon('req-upper', hasUpper);
          updateReqIcon('req-number', hasNumber);
          updateReqIcon('req-special', hasSpecial);
          
          // Update animated icon
          if (strengthIcon) {
            const colors = ['text-gray-400', 'text-orange-400', 'text-yellow-400', 'text-blue-400', 'text-green-500'];
            const svg = document.getElementById('strengthSvg') as SVGElement | null;
            
            // Si tous les critères sont satisfaits, afficher un checkmark vert
            if (criteriaCount === 5 && svg) {
              svg.innerHTML = '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" fill="currentColor"/>';
              svg.setAttribute('viewBox', '0 0 20 20');
              svg.setAttribute('class', 'w-6 h-6 text-green-500 animate-bounce transition-all duration-300');
            } else if (svg) {
              svg.innerHTML = '<circle cx="12" cy="12" r="10"/><path id="strengthPath" d="" class="transition-all duration-300"/>';
              svg.setAttribute('class', `w-5 h-5 transition-all duration-300 ${colors[criteriaCount]}`);
              svg.setAttribute('viewBox', '0 0 24 24');
              
              const newPath = svg.querySelector('#strengthPath') as SVGElement | null;
              
              // Update path based on criteria count
              const paths = [
                '', // 0: empty circle
                'M 12 8 A 4 4 0 0 1 16 12', // 1: quarter
                'M 12 8 A 4 4 0 0 1 16 12 A 4 4 0 0 1 12 16', // 2: half
                'M 12 8 A 4 4 0 0 1 16 12 A 4 4 0 0 1 12 16 A 4 4 0 0 1 8 12', // 3: three quarters
                'M 9 12.5 L 11 15 L 15 9' // 4: checkmark
              ];
              
              if (newPath) {
                newPath.setAttribute('d', paths[criteriaCount] || paths[0]);
                newPath.setAttribute('class', 'transition-all duration-300 stroke-current stroke-2 fill-none');
              }
            }
          }
          
          // Check match
          if (confirmPass.length > 0) {
            if (newPass === confirmPass && newPass.length > 0) {
              if (matchIcon) {
                matchIcon.innerHTML = '<svg class="w-6 h-6 text-green-500 animate-bounce" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>';
                matchIcon.classList.remove('hidden');
              }
              if (matchMessage) matchMessage.classList.add('hidden');
            } else {
              if (matchIcon) {
                matchIcon.innerHTML = '<svg class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>';
                matchIcon.classList.remove('hidden');
              }
              if (matchMessage) {
                matchMessage.classList.remove('hidden');
                matchMessage.textContent = 'Les mots de passe ne correspondent pas';
              }
            }
          } else {
            if (matchIcon) matchIcon.innerHTML = '';
            if (matchMessage) matchMessage.classList.add('hidden');
          }
        };
        
        newPasswordInput?.addEventListener('input', updatePasswordValidation);
        confirmPasswordInput?.addEventListener('input', updatePasswordValidation);
        
        if (currentPasswordInput) {
          currentPasswordInput.focus();
        }
      },
      preConfirm: () => {
        const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement)?.value;
        const newPassword = (document.getElementById('newPassword') as HTMLInputElement)?.value;
        const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement)?.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
          Swal.showValidationMessage('Tous les champs sont obligatoires');
          return false;
        }

        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('Les nouveaux mots de passe ne correspondent pas');
          return false;
        }

        // Critères stricts
        const hasLength = newPassword.length >= 6;
        const hasLower = /[a-z]/.test(newPassword);
        const hasUpper = /[A-Z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        const hasSpecial = /[!@#$%^&*]/.test(newPassword);

        if (!hasLength) {
          Swal.showValidationMessage('Le mot de passe doit contenir au moins 6 caractères');
          return false;
        }
        if (!hasLower) {
          Swal.showValidationMessage('Le mot de passe doit contenir au moins une lettre minuscule');
          return false;
        }
        if (!hasUpper) {
          Swal.showValidationMessage('Le mot de passe doit contenir au moins une lettre majuscule');
          return false;
        }
        if (!hasNumber) {
          Swal.showValidationMessage('Le mot de passe doit contenir au moins un chiffre');
          return false;
        }
        if (!hasSpecial) {
          Swal.showValidationMessage('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)');
          return false;
        }

        return { currentPassword, newPassword };
      }
    });

    if (formValues) {
      try {
        // Afficher un loader
        Swal.fire({
          title: 'Mise à jour en cours...',
          html: 'Veuillez patienter',
          icon: undefined,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Récupérer l'agent actuel
        const { data: agentData, error: fetchError } = await supabase
          .from('AGENTS')
          .select('*')
          .eq('id', agent.id)
          .single();

        if (fetchError || !agentData) {
          Swal.fire('Erreur', 'Impossible de récupérer vos informations', 'error');
          console.error('Erreur Supabase:', fetchError);
          return;
        }

        // Vérifier le mot de passe actuel
        const password = (agentData as any).password;
        const isPasswordValid = await bcryptjs.compare(formValues.currentPassword, password);

        if (!isPasswordValid) {
          Swal.fire('Erreur', 'Le mot de passe actuel est incorrect', 'error');
          return;
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcryptjs.hash(formValues.newPassword, 10);

        // Mettre à jour le mot de passe haché dans la colonne password
        const updateData: Record<string, string> = {};
        updateData.password = hashedPassword;
        
        const { error: updateError } = await supabase
          .from('AGENTS')
          .update(updateData)
          .eq('id', agent.id);

        if (updateError) {
          Swal.fire('Erreur', 'Impossible de mettre à jour votre mot de passe', 'error');
          console.error('Erreur Supabase:', updateError);
          return;
        }

        Swal.fire('Succès', 'Votre mot de passe a été mis à jour avec succès', 'success');
        setShowUserMenu(false);
      } catch (error) {
        console.error('Erreur:', error);
        Swal.fire('Erreur', 'Une erreur est survenue', 'error');
      }
    }
  };

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen text-white flex flex-col" style={{ fontFamily: '"Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-2 shadow-lg">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight uppercase">Régularisation</h1>
            <p className="text-xs text-slate-400 font-medium">Dossier Douane</p>
          </div>
        </div>
      </div>

      {/* ORIS Badge */}
      <div className="px-4 py-0.5 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 px-2.5 py-0.5 rounded-full shadow">
            <span className="text-white text-[10px] font-bold tracking-wider">ORIS</span>
          </div>
          <p className="text-[9px] text-slate-500 leading-tight">
            Operational Resource<br/>Intelligence System
          </p>
          <span className="text-[9px] text-slate-400 font-semibold">| SHIPPING GL</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        {navItems.filter((item) => canShowItem(item.id)).map((item) => {
          const Icon = item.icon;
          const isItemExpanded = isExpanded(item.id);

          // Mapping des couleurs sombres et fines pour chaque menu
          const menuColorMap: { [key: string]: { bar: string; accent: string; activeBg: string } } = {
            'dashboard': { bar: 'bg-blue-600', accent: 'text-blue-400', activeBg: 'bg-blue-700' },
            'regularisation': { bar: 'bg-amber-600', accent: 'text-amber-400', activeBg: 'bg-amber-700' },
            'parametres': { bar: 'bg-purple-600', accent: 'text-purple-400', activeBg: 'bg-purple-700' },
            'users': { bar: 'bg-emerald-600', accent: 'text-emerald-400', activeBg: 'bg-emerald-700' }
          };

          const menuColor = menuColorMap[item.id] || { bar: 'bg-slate-600', accent: 'text-slate-400', activeBg: 'bg-slate-700' };

          if (item.subItems) {
            return (
              <>
                {item.id === 'users' && (
                  <div className="my-4 border-t border-slate-600/20"></div>
                )}
                <div key={item.id} className="mb-2 group/menu">
                  <button
                    onClick={() => {
                      toggleMenu(item.id);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ease-out relative hover:scale-105 text-slate-300 hover:text-white`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${menuColor.bar} transition-all duration-300 ease-out`}></div>
                    <Icon size={19} className={`flex-shrink-0 transition-colors duration-300 ease-out ${
                      isItemExpanded ? menuColor.accent : 'group-hover:' + menuColor.accent
                    }`} />
                    <span className="flex-1 text-left relative group-hover:after:w-full after:w-0 after:h-0.5 after:bg-current after:absolute after:bottom-0 after:left-0 after:transition-all after:duration-300">
                      {item.label}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ease-out flex-shrink-0 ${
                        isItemExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isItemExpanded && (
                    <div className="ml-2 mt-2 space-y-1 animate-in slide-in-from-top-1 duration-300">
                      {item.subItems.filter((subItem) => canShowSubItem(subItem.id)).map((subItem) => {
                        const SubIcon = subItem.icon;

                        return (
                          <button
                            key={subItem.id}
                            onClick={() => handleMenuClick(subItem.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs transition-all duration-300 ease-out group relative hover:scale-105 ${
                              isSubMenuActive(subItem.id)
                                ? `${menuColor.activeBg} text-white font-semibold`
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${menuColor.bar} transition-all duration-300 ease-out`}></div>
                            <SubIcon size={15} className={`flex-shrink-0 transition-colors duration-300 ease-out ${
                              isSubMenuActive(subItem.id) ? menuColor.accent : 'group-hover:' + menuColor.accent
                            }`} />
                            <span className={`flex-1 text-left relative group-hover:after:w-full after:w-0 after:h-0.5 after:bg-current after:absolute after:bottom-0 after:left-0 after:transition-all after:duration-300`}>
                              {subItem.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ease-out group relative hover:scale-105 ${
                isSubMenuActive(item.id)
                  ? `${menuColor.activeBg} text-white`
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${menuColor.bar} transition-all duration-300 ease-out`}></div>
              <Icon size={19} className={`flex-shrink-0 transition-colors duration-300 ease-out ${
                isSubMenuActive(item.id) ? menuColor.accent : 'group-hover:' + menuColor.accent
              }`} />
              <span className="relative group-hover:after:w-full after:w-0 after:h-0.5 after:bg-current after:absolute after:bottom-0 after:left-0 after:transition-all after:duration-300">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-slate-700/50 bg-slate-800/50">
        {agent ? (
          <div className="p-4 space-y-3">
            {/* User Info - Clickable */}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 hover:bg-slate-700/40 rounded-lg p-2.5 transition-all duration-300 ease-out group"
            >
              <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                {(agent.nom?.[0] || agent.email?.[0] || '?').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-white truncate">
                  {agent.nom || 'Utilisateur'}
                </p>
                <p className="text-xs text-slate-400 truncate">{agent.role || 'Agent'}</p>
                {agent.region && (
                  <p className="text-xs text-slate-500 truncate">{agent.region}</p>
                )}
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ease-out flex-shrink-0 text-slate-400 ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* User Menu Items */}
            {showUserMenu && (
              <div className="space-y-1 animate-in slide-in-from-top-1 duration-300 bg-slate-700/20 rounded-lg p-2">
                <button
                  onClick={() => {
                    handleChangePassword();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ease-out text-slate-300 hover:bg-slate-700/50 hover:text-white"
                >
                  <Lock size={15} className="flex-shrink-0" />
                  <span>Changer de mot de passe</span>
                </button>

                <div className="my-1.5 border-t border-slate-600/30"></div>

                <button
                  onClick={() => {
                    setIsLoggingOut(true);
                    setShowUserMenu(false);
                    signOut();
                  }}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ease-out text-red-400 hover:bg-red-500/25 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut size={15} className="flex-shrink-0" />
                  <span>{isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-slate-400 text-xs font-medium">
            Authentification requise
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
