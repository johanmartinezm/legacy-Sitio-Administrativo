import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForumAdminService } from '../../../core/services/forum-admin.service';
import { ForumPost } from '../../../core/models/forum.model';

@Component({
  selector: 'app-forum-flagged-posts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forum-flagged-posts.component.html',
  styleUrls: ['./forum-flagged-posts.component.scss']
})
export class ForumFlaggedPostsComponent implements OnInit {
  flaggedPosts: ForumPost[] = [];

  constructor(private forumAdminService: ForumAdminService) {}

  ngOnInit(): void {
    this.loadFlaggedPosts();
  }

  loadFlaggedPosts() {
    this.forumAdminService.getFlaggedPosts().subscribe({
      next: (data) => this.flaggedPosts = data,
      error: (err) => console.error('Error loading flagged posts', err)
    });
  }

  deletePost(postId: string) {
    if(confirm('¿Estás seguro de eliminar esta publicación por contenido controversial? Esta acción no se puede deshacer.')) {
      this.forumAdminService.deletePost(postId).subscribe({
        next: () => this.loadFlaggedPosts(),
        error: (err) => console.error(err)
      });
    }
  }
}
