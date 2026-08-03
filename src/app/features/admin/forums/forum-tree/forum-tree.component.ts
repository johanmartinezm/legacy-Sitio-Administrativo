import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ForumAdminService } from '../../../../core/services/forum-admin.service';
import { ForumPost } from '../../../../core/models/forum.model';

interface TreeNode extends ForumPost {
  children: TreeNode[];
}

@Component({
  selector: 'app-forum-tree',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './forum-tree.component.html',
  styleUrls: ['./forum-tree.component.scss']
})
export class ForumTreeComponent implements OnInit {
  forumId: string = '';
  posts: TreeNode[] = [];
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumAdminService: ForumAdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.forumId = this.route.snapshot.paramMap.get('id') || '';
    if (this.forumId) {
      this.loadPosts();
    } else {
      this.router.navigate(['/admin/forums']);
    }
  }

  loadPosts(): void {
    this.isLoading = true;
    this.forumAdminService.getForumTree(this.forumId).subscribe({
      next: (data) => {
        this.posts = this.buildTree(data);
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar el hilo de mensajes', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  buildTree(flatList: ForumPost[]): TreeNode[] {
    const nodeMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Initialize all nodes
    flatList.forEach(item => {
      nodeMap.set(item.id, { ...item, children: [] });
    });

    // Build hierarchy
    flatList.forEach(item => {
      const node = nodeMap.get(item.id)!;
      if (item.parent_id && nodeMap.has(item.parent_id)) {
        nodeMap.get(item.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  deletePost(postId: string): void {
    if (confirm('¿Estás seguro de eliminar este comentario? (Se ocultará)')) {
      this.forumAdminService.deletePost(postId).subscribe({
        next: () => {
          this.snackBar.open('Comentario eliminado', 'Cerrar', { duration: 3000 });
          this.loadPosts(); // reload tree
        },
        error: () => {
          this.snackBar.open('Error al eliminar comentario', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}
