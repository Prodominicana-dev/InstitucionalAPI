import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { generateToken } from '../validation/validation';

/**
 * Servicio para obtener responsables de feedback desde Auth0
 * Los responsables son usuarios admin con permisos/etiquetas específicas
 */
@Injectable()
export class FeedbackResponsibleService {
  // Permisos que identifican a los responsables de feedback
  private readonly FEEDBACK_PERMISSIONS = {
    general: 'manage:feedback', // Responsables generales
    investment: 'manage:feedback-investment', // Específico de inversión
    export: 'manage:feedback-export', // Específico de exportación
    all: 'manage:feedback-all', // Recibe todos los feedbacks
  };

  /**
   * Obtiene usuarios de Auth0 con un permiso específico
   */
  private async getUsersByPermission(permission: string): Promise<any[]> {
    try {
      const token = await generateToken();
      
      // Obtener todos los usuarios con el permiso específico
      const response = await axios.get(
        `${process.env.API_IDENTIFIER}users`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          params: {
            q: `permissions:"${permission}"`,
            search_engine: 'v3',
          },
        }
      );

      return response.data || [];
    } catch (error) {
      console.error(`Error al obtener usuarios con permiso ${permission}:`, error.message);
      return [];
    }
  }

  /**
   * Obtiene correos de usuarios con permisos específicos
   */
  private async getEmailsByPermissions(permissions: string[]): Promise<string[]> {
    try {
      const token = await generateToken();
      const allEmails = new Set<string>();

      // Para cada permiso, buscar usuarios
      for (const permission of permissions) {
        try {
          const response = await axios.get(
            `${process.env.API_IDENTIFIER}users`,
            {
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
              params: {
                q: `permissions.name:"${permission}"`,
                search_engine: 'v3',
                fields: 'email,user_id,name',
              },
            }
          );

          const users = response.data || [];
          users.forEach(user => {
            if (user.email && user.email.trim()) {
              allEmails.add(user.email.trim());
            }
          });
        } catch (error) {
          console.error(`Error al buscar usuarios con permiso ${permission}:`, error.message);
        }
      }

      return Array.from(allEmails);
    } catch (error) {
      console.error('Error al obtener emails desde Auth0:', error.message);
      return [];
    }
  }

  /**
   * Obtiene todos los responsables activos (generales)
   * Usuarios con permisos: manage:feedback o manage:feedback-all
   */
  async getAllActive(): Promise<string[]> {
    const permissions = [
      this.FEEDBACK_PERMISSIONS.general,
      this.FEEDBACK_PERMISSIONS.all,
    ];
    
    const emails = await this.getEmailsByPermissions(permissions);
    
    if (emails.length === 0) {
      console.warn('No se encontraron responsables en Auth0, usando fallback');
    }
    
    return emails;
  }

  /**
   * Obtiene responsables por tipo de servicio
   * Incluye tanto los específicos del tipo como los generales
   */
  async getByServiceType(serviceType?: string): Promise<string[]> {
    if (!serviceType) {
      return this.getAllActive();
    }

    const permissions = [this.FEEDBACK_PERMISSIONS.all]; // Siempre incluir los que reciben todos

    // Agregar permiso específico según el tipo
    switch (serviceType.toLowerCase()) {
      case 'investment':
        permissions.push(this.FEEDBACK_PERMISSIONS.investment);
        break;
      case 'export':
        permissions.push(this.FEEDBACK_PERMISSIONS.export);
        break;
      case 'general':
        permissions.push(this.FEEDBACK_PERMISSIONS.general);
        break;
    }

    const emails = await this.getEmailsByPermissions(permissions);
    
    if (emails.length === 0) {
      console.warn(`No se encontraron responsables para tipo: ${serviceType}`);
    }
    
    return emails;
  }

  /**
   * Lista todos los usuarios con permisos de feedback desde Auth0
   */
  async findAll() {
    try {
      const token = await generateToken();
      
      // Buscar todos los usuarios con algún permiso de feedback
      const allPermissions = Object.values(this.FEEDBACK_PERMISSIONS);
      const usersMap = new Map();

      for (const permission of allPermissions) {
        try {
          const response = await axios.get(
            `${process.env.API_IDENTIFIER}users`,
            {
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
              params: {
                q: `permissions.name:"${permission}"`,
                search_engine: 'v3',
              },
            }
          );

          const users = response.data || [];
          users.forEach(user => {
            if (!usersMap.has(user.user_id)) {
              usersMap.set(user.user_id, {
                id: user.user_id,
                email: user.email,
                name: user.name || user.email,
                permissions: [],
              });
            }
            usersMap.get(user.user_id).permissions.push(permission);
          });
        } catch (error) {
          console.error(`Error al buscar usuarios con permiso ${permission}:`, error.message);
        }
      }

      return Array.from(usersMap.values());
    } catch (error) {
      console.error('Error al listar usuarios desde Auth0:', error);
      return [];
    }
  }

  /**
   * Obtiene información de un usuario específico
   */
  async findOne(userId: string) {
    try {
      const token = await generateToken();
      
      const response = await axios.get(
        `${process.env.API_IDENTIFIER}users/${userId}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error al obtener usuario ${userId}:`, error.message);
      return null;
    }
  }
}
